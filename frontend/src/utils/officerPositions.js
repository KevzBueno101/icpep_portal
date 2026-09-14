export const OFFICER_GROUPS = [
  {
    label: 'HEAD OFFICE',
    positions: [
      'President',
      'Internal Vice President',
      'External Vice President',
      'Secretary',
      'Assistant Secretary',
      'Finance Executive',
      'Assistant Finance Executive',
      'Auditor',
      'Logistic',
      'Business Managers',
      'Public Relations Officer',
      'Project Manager',
    ],
  },
  {
    label: 'DIRECTORS OFFICE',
    positions: [
      'Membership Director',
      'Academic Director',
      'Creative Director',
      'Multimedia Director',
      'Sports Director',
      'Outreach Director',
      'Management & Budget Director',
      'Compliance Director',
    ],
  },
  {
    label: 'YR. LVL. REPRESENTATIVES',
    positions: [
      '4th Year Representative',
      '3rd Year Representative',
      '2nd Year Representative',
      '1st Year Representative',
    ],
  },
]

export const positionsForGroup = (groupLabel) => {
  const group = OFFICER_GROUPS.find((g) => g.label === groupLabel)
  return group ? group.positions : []
}