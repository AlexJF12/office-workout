import { FLOOR } from './rig';

export type PropSpec =
  | { kind: 'chair'; x: number; seat?: number; back?: number }
  | { kind: 'chairFront'; x: number; seat?: number }
  | { kind: 'desk'; x: number; top?: number }
  | { kind: 'wall'; x: number }
  | { kind: 'wallFront' }
  | { kind: 'door'; x: number };

/** Background furniture, drawn behind the figure. `x` is the edge nearest the figure. */
export function Prop({ spec }: { spec: PropSpec }) {
  switch (spec.kind) {
    case 'chair': {
      // Side view, figure faces right; x is the backrest.
      const seat = spec.seat ?? 167;
      const back = spec.back ?? 110;
      return (
        <g className="prop">
          <rect x={spec.x - 3} y={back} width={6} height={seat - back + 2} rx={3} />
          <rect x={spec.x - 3} y={seat} width={50} height={6} rx={3} />
          <rect x={spec.x + 21} y={seat + 6} width={4} height={FLOOR - seat - 14} />
          <rect x={spec.x + 5} y={FLOOR - 9} width={36} height={4} rx={2} />
        </g>
      );
    }
    case 'chairFront': {
      // Front view office chair. The seat is drawn at hip height and wider than
      // the hips, so it shows on both sides of the thighs and the figure reads as seated.
      const seat = spec.seat ?? 150;
      return (
        <g className="prop">
          <rect x={spec.x - 25} y={seat - 64} width={50} height={64} rx={9} className="prop-soft" />
          <path d={`M${spec.x - 30} ${seat - 4} H${spec.x + 30} L${spec.x + 37} ${seat + 4} H${spec.x - 37} Z`} className="prop-soft" />
          <rect x={spec.x - 37} y={seat + 3} width={74} height={10} rx={4} />
          <rect x={spec.x - 3} y={seat + 13} width={6} height={FLOOR - seat - 25} />
          <rect x={spec.x - 34} y={FLOOR - 13} width={68} height={5} rx={2.5} />
          <circle cx={spec.x - 31} cy={FLOOR - 5} r={4} />
          <circle cx={spec.x + 31} cy={FLOOR - 5} r={4} />
        </g>
      );
    }
    case 'desk': {
      const top = spec.top ?? 135;
      return (
        <g className="prop">
          <rect x={spec.x} y={top} width={200 - spec.x + 10} height={6} rx={2} />
          <rect x={spec.x + 8} y={top + 6} width={5} height={FLOOR - top - 6} />
        </g>
      );
    }
    case 'wall':
      return (
        <g className="prop">
          <rect x={spec.x - 12} y={10} width={12} height={FLOOR - 10} className="prop-soft" />
        </g>
      );
    case 'wallFront':
      return <rect x={30} y={18} width={140} height={FLOOR - 18} rx={6} className="prop prop-soft" />;
    case 'door':
      return (
        <g className="prop">
          <rect x={spec.x - 5} y={22} width={7} height={FLOOR - 22} rx={2} />
          <rect x={spec.x - 5} y={22} width={40} height={6} rx={2} />
        </g>
      );
  }
}
