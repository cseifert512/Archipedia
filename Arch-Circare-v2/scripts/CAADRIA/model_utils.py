import os
from typing import Tuple
import numpy as np
from PIL import Image, ImageFilter

import torch
import timm
try:
	import cv2  # type: ignore
	_CV2 = True
except Exception:
	_CV2 = False


def load_model_and_transform(model_name: str | None = None) -> Tuple[torch.nn.Module, any, torch.device]:
	model_name = model_name or os.getenv("MODEL_NAME", "vit_small_patch14_dinov2")
	device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
	model = timm.create_model(model_name, pretrained=True)
	model.eval()
	if hasattr(model, "reset_classifier"):
		model.reset_classifier(0)
	cfg = timm.data.resolve_data_config({}, model=model)
	transform = timm.data.create_transform(**cfg, is_training=False)
	model.to(device)
	return model, transform, device


def embed_image(pil_image: Image.Image, model: torch.nn.Module, transform, device: torch.device) -> np.ndarray:
	with torch.no_grad():
		x = transform(pil_image.convert("RGB")).unsqueeze(0).to(device)
		feat = model(x)
		vec = feat.detach().cpu().numpy().astype("float32")
	norm = np.linalg.norm(vec, axis=1, keepdims=True) + 1e-12
	vec = vec / norm
	return vec[0]


def compute_saliency_map(pil_image: Image.Image, model: torch.nn.Module, transform, device: torch.device) -> np.ndarray:
	model.zero_grad(set_to_none=True)
	model.eval()
	x = transform(pil_image.convert("RGB")).unsqueeze(0).to(device)
	x.requires_grad_(True)
	feat = model(x)
	score = feat.norm(p=2, dim=1).sum()
	score.backward()
	grad = x.grad.detach().abs().mean(dim=1, keepdim=True)[0, 0]
	grad_np = grad.cpu().numpy().astype("float32")
	mn, mx = float(grad_np.min()), float(grad_np.max())
	if mx > mn:
		grad_np = (grad_np - mn) / (mx - mn)
	else:
		grad_np = np.zeros_like(grad_np, dtype="float32")
	return grad_np


def generate_sexy_saliency_overlay(pil_image: Image.Image, model: torch.nn.Module, transform, device: torch.device, alpha: float = 0.6, power: float = 1.8) -> Image.Image:
	# base saliency -> resize to image size
	hm_raw = compute_saliency_map(pil_image, model, transform, device)
	W, H = pil_image.size
	hm = np.array(Image.fromarray((hm_raw * 255).astype("uint8")).resize((W, H), Image.BICUBIC)).astype("float32") / 255.0
	# Gaussian smoothing
	if _CV2:
		hm_sm = cv2.GaussianBlur(hm, (0, 0), sigmaX=3)
	else:
		hm_sm = np.array(Image.fromarray((hm * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(radius=2))).astype("float32") / 255.0
	# Canny edges and mix
	if _CV2:
		gray = np.array(pil_image.convert("L"))
		edges = cv2.Canny(gray, 60, 120).astype("float32") / 255.0
		edges = cv2.GaussianBlur(edges, (0, 0), sigmaX=1.2)
		hm_mix = 0.75 * hm_sm + 0.25 * edges
	else:
		hm_mix = hm_sm
	# Border falloff
	y = np.linspace(0, 1, H, dtype="float32")
	x = np.linspace(0, 1, W, dtype="float32")
	X, Y = np.meshgrid(x, y)
	border_mask = (np.minimum(np.minimum(X, 1 - X), np.minimum(Y, 1 - Y)) * 2.0)
	border_mask = np.clip(border_mask, 0.0, 1.0)
	hm_final = np.clip(hm_mix * border_mask, 0.0, 1.0) ** power
	# Colorize (red/yellow)
	col = np.zeros((H, W, 3), dtype="float32")
	col[..., 0] = hm_final
	col[..., 1] = np.sqrt(hm_final)
	col[..., 2] = 0.0
	col = (np.clip(col, 0, 1) * 255).astype("uint8")
	return Image.fromarray(col)


def generate_vivid_saliency_blend(pil_image: Image.Image, model: torch.nn.Module, transform, device: torch.device, alpha: float = 0.9, power: float = 3.2, halo_sigma: float = 3.5) -> Image.Image:
	"""
	Vivid heatmap with screen-like blending and halo.
	"""
	base = np.array(pil_image).astype("float32") / 255.0
	W, H = pil_image.size
	# Saliency
	hm_raw = compute_saliency_map(pil_image, model, transform, device)
	hm = np.array(Image.fromarray((hm_raw * 255).astype("uint8")).resize((W, H), Image.BICUBIC)).astype("float32") / 255.0
	hm = np.clip(hm, 0.0, 1.0) ** power
	# Halo/alpha
	if _CV2:
		alph = cv2.GaussianBlur(hm, (0, 0), sigmaX=max(0.1, halo_sigma))
	else:
		alph = np.array(Image.fromarray((hm * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(radius=max(0.1, halo_sigma)))).astype("float32") / 255.0
	alph = np.clip(alph, 0.0, 1.0)
	# JET colormap
	if _CV2:
		col = cv2.applyColorMap((hm * 255).astype("uint8"), cv2.COLORMAP_JET)
		col = cv2.cvtColor(col, cv2.COLOR_BGR2RGB).astype("float32") / 255.0
	else:
		col = np.zeros((H, W, 3), dtype="float32")
		col[..., 0] = hm
		col[..., 1] = np.sqrt(hm)
		col[..., 2] = (1.0 - hm) * 0.6
		col = np.clip(col, 0.0, 1.0)
	# Screen blend
	a = (alpha * alph)[..., None]
	out = 1.0 - (1.0 - base) * (1.0 - a * col)
	return Image.fromarray(np.clip(out * 255.0, 0, 255).astype("uint8"))

