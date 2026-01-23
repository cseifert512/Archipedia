# Custom Data Reformatting Scripts

Place your custom data conversion scripts here.

## Purpose

If your source data isn't in Archipedia's expected format, create a script here to reformat it before importing.

## Expected Output Format

Your script should produce this folder structure:

```
output_folder/
├── Project_Name_1/
│   ├── images/
│   │   ├── image_001.jpg
│   │   ├── image_002.jpg
│   │   └── ...
│   └── metadata/
│       └── info.json
├── Project_Name_2/
│   └── ...
```

## Metadata JSON Schema

```json
{
  "title": "Project Name / Architect Name",
  "architect": "Firm Name",
  "location": "City, Country",
  "year": "2024",
  "description": "Description text...",
  "tags": ["tag1", "tag2"],
  "url": "https://source-url.com/..."
}
```

## Template

See `reformat_template.py` for a starting template.

## Usage

```powershell
python scripts/custom/your_script.py --source "C:\raw_data" --output "C:\formatted_data"
```

Then run the import:

```powershell
python scripts/import_dataset.py --source "C:\formatted_data"
```

