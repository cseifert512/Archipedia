/**
 * Boards API - Client for board persistence endpoints
 */

import { Board, BoardBlock, ReferenceBlockData } from '../stores/boardStore';

function getApiBaseUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (raw && raw.trim()) ? raw.trim().replace(/\/+$/, '') : 'http://localhost:8000';
}

function getAuthHeader(): Record<string, string> {
  const token = ((import.meta as any).env?.VITE_API_TOKEN as string | undefined)?.trim();
  if (!token) return {};
  return { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` };
}

// ============ Types ============

export interface BoardResponse {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_image_url?: string;
  layout_preset: string;
  page_format: string;
  share_token: string;
  blocks: Array<{
    id: string;
    type: string;
    position: number;
    data: Record<string, any>;
  }>;
  created_at: string;
  updated_at: string;
}

export interface BoardListItem {
  id: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  block_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBoardRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  layout_preset?: string;
  page_format?: string;
}

export interface UpdateBoardRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  cover_image_url?: string;
  layout_preset?: string;
  page_format?: string;
}

export interface CreateBlockRequest {
  type: string;
  data: Record<string, any>;
  position?: number;
}

export interface UpdateBlockRequest {
  data?: Record<string, any>;
  position?: number;
}

// ============ Board CRUD ============

export async function createBoard(request: CreateBoardRequest = {}): Promise<BoardResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to create board: ${text || res.statusText}`);
  }

  return res.json();
}

export async function getBoard(boardId: string): Promise<BoardResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Board not found');
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to get board: ${text || res.statusText}`);
  }

  return res.json();
}

export async function getBoardByShareToken(token: string): Promise<BoardResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/b/${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Board not found');
    }
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to get board: ${text || res.statusText}`);
  }

  return res.json();
}

export async function updateBoard(boardId: string, request: UpdateBoardRequest): Promise<BoardResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update board: ${text || res.statusText}`);
  }

  return res.json();
}

export async function deleteBoard(boardId: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete board: ${text || res.statusText}`);
  }
}

export async function listBoards(limit = 50, offset = 0): Promise<BoardListItem[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to list boards: ${text || res.statusText}`);
  }

  return res.json();
}

// ============ Block CRUD ============

export async function addBlock(boardId: string, request: CreateBlockRequest): Promise<{
  id: string;
  type: string;
  position: number;
  data: Record<string, any>;
}> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}/blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to add block: ${text || res.statusText}`);
  }

  return res.json();
}

export async function updateBlock(
  boardId: string,
  blockId: string,
  request: UpdateBlockRequest
): Promise<{
  id: string;
  type: string;
  position: number;
  data: Record<string, any>;
}> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}/blocks/${blockId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update block: ${text || res.statusText}`);
  }

  return res.json();
}

export async function deleteBlock(boardId: string, blockId: string): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}/blocks/${blockId}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to delete block: ${text || res.statusText}`);
  }
}

export async function reorderBlocks(boardId: string, blockIds: string[]): Promise<void> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/boards/${boardId}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ block_ids: blockIds }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to reorder blocks: ${text || res.statusText}`);
  }
}

// ============ Sync Utilities ============

/**
 * Convert a local Board to API format for syncing
 */
export function localBoardToApiFormat(board: Board): CreateBoardRequest & { blocks: CreateBlockRequest[] } {
  return {
    title: board.title,
    subtitle: board.subtitle,
    description: board.description,
    layout_preset: board.layout_preset,
    page_format: board.page_format,
    blocks: board.blocks.map((block) => ({
      type: block.type,
      data: block.data,
      position: block.position,
    })),
  };
}

/**
 * Convert API response to local Board format
 */
export function apiBoardToLocalFormat(response: BoardResponse): Board {
  return {
    id: response.id,
    title: response.title,
    subtitle: response.subtitle,
    description: response.description,
    cover_image_url: response.cover_image_url,
    layout_preset: response.layout_preset as Board['layout_preset'],
    page_format: response.page_format as Board['page_format'],
    share_token: response.share_token,
    blocks: response.blocks.map((block) => ({
      id: block.id,
      type: block.type as BoardBlock['type'],
      position: block.position,
      data: block.data,
    })) as BoardBlock[],
    created_at: response.created_at,
    updated_at: response.updated_at,
  };
}

