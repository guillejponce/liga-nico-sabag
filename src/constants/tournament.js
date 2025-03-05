export const TOURNAMENT_PHASES = {
  GROUP_STAGE: {
    label: 'Fase de Grupos',
    phases: [
      { value: 'group_a', label: 'Grupo A' },
      { value: 'group_b', label: 'Grupo B' }
    ]
  },
  CLASSIFICATION: {
    label: 'Fase de Clasificación',
    phases: [
      { value: 'gold_group', label: 'Grupo Oro' },
      { value: 'silver_group', label: 'Grupo Plata' },
      { value: 'bronze_group', label: 'Grupo Bronce' }
    ]
  },
  PLAYOFFS: {
    label: 'Fase Final',
    phases: [
      { value: 'gold_semi', label: 'Semifinal Oro' },
      { value: 'gold_final', label: 'Final Oro' },
      { value: 'silver_semi', label: 'Semifinal Plata' },
      { value: 'silver_final', label: 'Final Plata' },
      { value: 'bronze_semi', label: 'Semifinal Bronce' },
      { value: 'bronze_final', label: 'Final Bronce' }
    ]
  }
}; 