import csv
import json

def transform_item(item):
  # split vocals & theme fields into array
  if 'vocalsLead' in item and len(item['vocalsLead']) > 0:
    item['vocalsLead'] = item['vocalsLead'].split(',')
  else:
    item['vocalsLead'] = []

  if 'vocalsBackup' in item and len(item['vocalsBackup']) > 0:
    item['vocalsBackup'] = item['vocalsBackup'].split(',')
  else:
    item['vocalsBackup'] = []
  
  if 'theme' in item and len(item['theme']) > 0:
    item['theme'] = item['theme'].split(',')
  else:
    item['theme'] = []
  
  # convert number strings to integers
  item['id'] = int(item['id']) if len(item['id']) > 0 else None
  item['albumId'] = int(item['albumId']) if len(item['albumId']) > 0 else None
  item['length'] = int(item['length']) if len(item['length']) > 0 else None
  item['ukChartPeak'] = int(item['ukChartPeak']) if len(item['ukChartPeak']) > 0 else None
  item['ukChartWeeks'] = int(item['ukChartWeeks']) if len(item['ukChartWeeks']) > 0 else None
  item['usChartPeak'] = int(item['usChartPeak']) if len(item['usChartPeak']) > 0 else None
  item['usChartWeeks'] = int(item['usChartWeeks']) if len(item['usChartWeeks']) > 0 else None

  return item


def convert_csv_to_json(csv_file_path, json_file_path):
  data = []
  with open(csv_file_path, 'r', encoding='utf-8-sig') as csvf:
    csv_reader = csv.DictReader(csvf)
    for row in csv_reader:
      converted_row = transform_item(row)
      data.append(converted_row)

  with open(json_file_path, 'w', encoding='utf-8-sig') as jsonf:
    jsonf.write(json.dumps(data, indent=2))

# The executable:
convert_csv_to_json('Beatles_Songs.csv', '../mockApi/songs.json')