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
      const seat = spec.seat ?? 157;
      const w = 52;
      return (
        <g className="prop">
          <rect x={spec.x - w / 2 + 4} y={seat - 64} width={w - 8} height={64} rx={8} className="prop-soft" />
          <rect x={spec.x - w / 2} y={seat} width={w} height={7} rx={3} />
          <rect x={spec.x - 2} y={seat + 7} width={4} height={FLOOR - seat - 15} />
          <rect x={spec.x - 20} y={FLOOR - 9} width={40} height={4} rx={2} />
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
