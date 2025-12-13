// Auto-layout algorithms for node positioning

export interface Position {
  x: number;
  y: number;
}

export function calculateGridPosition(
  index: number,
  total: number,
  nodeWidth: number = 280,
  nodeHeight: number = 200,
  margin: number = 40
): Position {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  return {
    x: col * (nodeWidth + margin),
    y: row * (nodeHeight + margin),
  };
}

export function calculateHorizontalLayout(
  index: number,
  nodeWidth: number = 280,
  margin: number = 40
): Position {
  return {
    x: index * (nodeWidth + margin),
    y: 0,
  };
}

export function calculateVerticalLayout(
  index: number,
  nodeHeight: number = 200,
  margin: number = 40
): Position {
  return {
    x: 0,
    y: index * (nodeHeight + margin),
  };
}

export function calculateFanLayout(
  index: number,
  total: number,
  radius: number = 200,
  startAngle: number = -Math.PI / 4,
  endAngle: number = Math.PI / 4
): Position {
  const angle = startAngle + (index / (total - 1 || 1)) * (endAngle - startAngle);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

