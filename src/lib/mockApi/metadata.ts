export const songFields = [
  {
    id: 'id',
    name: 'Song',
    description: 'Unique Song ID, sorted by album and track number',
    label: {
      id: 'title',
      name: 'Song Title',
      display: true
    },
    type: 'categorical',
    format: 'number',
    filterable: false,
    searchable: true
  },
  {
    id: 'albumId',
    name: 'Album',
    description: 'Album containing song',
    label: {
      id: 'albumTitle',
      name: 'Album Title',
      display: true
    },
    type: 'categorical',
    format: 'number',
    filterable: true,
    searchable: true
  },
  {
    id: 'year',
    name: 'Year',
    description: 'Song/album release year',
    type: 'time',
    filterable: true,
    searchable: false
  },
  {
    id: 'vocalsLead',
    name: 'Lead Vocals',
    type: 'array|string',
    filterable: true,
    searchable: false
  },
  {
    id: 'vocalsBackup',
    name: 'Supporting Vocals',
    type: 'categorical',
    format: 'array|string',
    filterable: true,
    searchable: false
  },
  {
    id: 'theme',
    name: 'Song Theme',
    description: 'Is there a special theme to the song? Love, Money, Drugs, or Animals',
    type: 'categorical',
    format: 'string',
    filterable: true,
    searchable: false
  },
  {
    id: 'length',
    name: 'Song Length in Seconds',
    type: 'numerical',
    format: 'integer',
    filterable: false,
    searchable: false
  },
  {
    id: 'ukChartPeak',
    name: 'Peak Chart Position (UK)',
    description: 'UK Official Singles Chart',
    type: 'numerical',
    format: 'integer',
    filterable: true,
    searchable: false
  },
  {
    id: 'ukChartWeeks',
    name: 'Weeks on UK Charts',
    type: 'numerical',
    format: 'integer',
    filterable: true,
    searchable: false
  },
  {
    id: 'usChartPeak',
    name: 'Peak Chart Position (US)',
    description: 'Billboard Hot 100',
    type: 'numerical',
    format: 'integer',
    filterable: true,
    searchable: false
  },
  {
    id: 'usChartWeeks',
    name: 'Weeks on US Charts',
    description: 'Billboard Hot 100',
    type: 'numerical',
    format: 'integer',
    filterable: true,
    searchable: false
  }
]
