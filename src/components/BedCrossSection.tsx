import { glyphKind, type Crop } from "@/types/crop";
import type { Units } from "@/types/farm";
import {
  BED_WIDTH_IN,
  dripLineCentersIn,
  formatLengthIn,
  formatTemp,
  rowCentersIn,
} from "@/lib/math";
import { cn } from "@/lib/utils";

type Props = {
  crop: Crop | null;
  units: Units;
  widthIn?: number;
  className?: string;
  title?: string;
};

export function BedCrossSection({
  crop,
  units,
  widthIn = BED_WIDTH_IN,
  className,
  title,
}: Props) {
  const vbW = 560;
  const vbH = 268;
  const bedX = 80;
  const bedW = 400;
  const surfaceY = 118;
  const soilBottom = 210;
  const rows = crop ? rowCentersIn(crop.fieldGeometry.rowsPerBed, widthIn) : [];
  const drips = crop ? dripLineCentersIn(crop.irrigationProfile.linesPerBed, widthIn) : [];
  const xAt = (inch: number) => bedX + (inch / widthIn) * bedW;
  const pathW = 52;
  const kind = crop ? glyphKind(crop.category) : "leaf";

  return (
    <figure className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <figcaption className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        <span>{title ?? "30 in bed · cross section"}</span>
        <span className="text-faint">scale 1:8 · looking east</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="h-auto w-full text-fg"
        role="img"
        aria-label={
          crop
            ? `${widthIn}-inch bed cross section, ${crop.fieldGeometry.rowsPerBed} rows of ${crop.cultivar}, ${crop.irrigationProfile.linesPerBed} drip lines`
            : `${widthIn}-inch empty bed cross section`
        }
      >
        <rect width={vbW} height={vbH} fill="#09090b" />
        {[80, 160, 240, 320, 400, 480].map((x) => (
          <line key={x} x1={x} y1={28} x2={x} y2={248} stroke="#18181b" strokeWidth="1" />
        ))}

        <polygon
          points={`${bedX - pathW},${soilBottom} ${bedX},${surfaceY + 18} ${bedX + bedW},${surfaceY + 18} ${bedX + bedW + pathW},${soilBottom}`}
          fill="#141416"
        />
        <polygon
          points={`${bedX},${surfaceY + 18} ${bedX + 10},${surfaceY} ${bedX + bedW - 10},${surfaceY} ${bedX + bedW},${surfaceY + 18} ${bedX + bedW},${soilBottom - 8} ${bedX},${soilBottom - 8}`}
          fill="#1c1910"
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <rect x={bedX + 8} y={surfaceY + 22} width={bedW - 16} height="18" fill="#292524" opacity="0.85" />
        <text x={bedX + 16} y={surfaceY + 35} fill="#71717a" fontSize="8" fontFamily="IBM Plex Mono, monospace">
          COMPOST ½ in
        </text>
        <text x={bedX + 16} y={surfaceY + 62} fill="#52525b" fontSize="8" fontFamily="IBM Plex Mono, monospace">
          LOAM 8 in
        </text>

        <line
          x1={bedX - pathW}
          y1={soilBottom}
          x2={bedX + bedW + pathW}
          y2={soilBottom}
          stroke="#3f3f46"
          strokeWidth="1"
        />
        <text x={bedX - pathW + 4} y={soilBottom + 14} fill="#52525b" fontSize="8" fontFamily="IBM Plex Mono, monospace">
          PATH
        </text>
        <text
          x={bedX + bedW + pathW - 28}
          y={soilBottom + 14}
          fill="#52525b"
          fontSize="8"
          fontFamily="IBM Plex Mono, monospace"
        >
          PATH
        </text>

        <Dimension
          x1={bedX}
          x2={bedX + bedW}
          y={36}
          label={formatLengthIn(widthIn, units).toUpperCase() + " GROWING"}
        />

        {drips.map((inch, i) => {
          const x = xAt(inch);
          return (
            <g key={`drip-${i}`}>
              <line
                x1={x}
                y1={surfaceY + 8}
                x2={x}
                y2={surfaceY + 48}
                stroke="#3f3f46"
                strokeWidth="2"
              />
              <circle cx={x} cy={surfaceY + 14} r="2.4" fill="#52525b" />
            </g>
          );
        })}

        {rows.map((inch, i) => {
          const x = xAt(inch);
          return (
            <g key={`row-${i}`}>
              <line
                x1={x}
                y1={surfaceY - 8}
                x2={x}
                y2={surfaceY + 70}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="2 3"
                opacity="0.55"
              />
              <PlantGlyph type={kind} x={x} y={surfaceY} swatch={crop?.swatch ?? "#f59e0b"} />
              <text
                x={x}
                y={surfaceY + 86}
                fill="#a1a1aa"
                fontSize="8"
                fontFamily="IBM Plex Mono, monospace"
                textAnchor="middle"
              >
                R{i + 1}
              </text>
            </g>
          );
        })}

        {crop ? (
          <g>
            <text x={24} y={54} fill="#f59e0b" fontSize="11" fontFamily="Barlow Condensed, sans-serif" fontWeight="600">
              {crop.cultivar.toUpperCase()}
            </text>
            <text x={24} y={70} fill="#a1a1aa" fontSize="9" fontFamily="IBM Plex Mono, monospace">
              {crop.fieldGeometry.rowsPerBed} ROW · {formatLengthIn(crop.fieldGeometry.inRowSpacingIn, units)} IN-ROW
            </text>
            <text x={24} y={84} fill="#71717a" fontSize="9" fontFamily="IBM Plex Mono, monospace">
              {crop.fieldGeometry.plantsPerLinearFoot} PLT / FT · {crop.irrigationProfile.linesPerBed} DRIP · GERM{" "}
              {formatTemp(crop.propagation.minGermTempF, units)}
            </text>
          </g>
        ) : (
          <text x={24} y={64} fill="#71717a" fontSize="10" fontFamily="IBM Plex Mono, monospace">
            EMPTY BED — SELECT A CULTIVAR
          </text>
        )}

        <text x={24} y={252} fill="#52525b" fontSize="8" fontFamily="IBM Plex Mono, monospace">
          STANDARD 30 IN BIOINTENSIVE · AISLES 18 IN TYP.
        </text>
      </svg>
    </figure>
  );
}

function Dimension({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#f59e0b" strokeWidth="1" />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} stroke="#f59e0b" strokeWidth="1" />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} stroke="#f59e0b" strokeWidth="1" />
      <text
        x={(x1 + x2) / 2}
        y={y - 7}
        fill="#f59e0b"
        fontSize="9"
        fontFamily="IBM Plex Mono, monospace"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

function PlantGlyph({
  type,
  x,
  y,
  swatch,
}: {
  type: "leaf" | "root" | "fruit" | "allium" | "flower";
  x: number;
  y: number;
  swatch: string;
}) {
  if (type === "root") {
    return (
      <g>
        <line x1={x} y1={y - 22} x2={x} y2={y + 28} stroke={swatch} strokeWidth="1.4" />
        <ellipse cx={x} cy={y + 34} rx="4" ry="10" fill="none" stroke={swatch} strokeWidth="1.2" />
        <path d={`M${x} ${y - 22} c -8 -8 -12 -4 -10 4`} fill="none" stroke={swatch} strokeWidth="1.2" />
        <path d={`M${x} ${y - 22} c 8 -8 12 -4 10 4`} fill="none" stroke={swatch} strokeWidth="1.2" />
      </g>
    );
  }
  if (type === "fruit") {
    return (
      <g>
        <line x1={x} y1={y - 36} x2={x} y2={y} stroke={swatch} strokeWidth="1.6" />
        <circle cx={x - 7} cy={y - 22} r="4.5" fill="none" stroke={swatch} strokeWidth="1.2" />
        <circle cx={x + 8} cy={y - 16} r="5" fill="none" stroke={swatch} strokeWidth="1.2" />
        <path d={`M${x} ${y - 28} l 10 -6`} stroke={swatch} strokeWidth="1" />
      </g>
    );
  }
  if (type === "allium") {
    return (
      <g>
        <line x1={x} y1={y - 32} x2={x} y2={y + 10} stroke={swatch} strokeWidth="1.2" />
        <line x1={x - 3} y1={y - 30} x2={x - 1} y2={y} stroke={swatch} strokeWidth="1" />
        <line x1={x + 3} y1={y - 30} x2={x + 1} y2={y} stroke={swatch} strokeWidth="1" />
        <circle cx={x} cy={y + 14} r="5" fill="none" stroke={swatch} strokeWidth="1.2" />
      </g>
    );
  }
  if (type === "flower") {
    const cy = y - 34;
    return (
      <g>
        <line x1={x} y1={cy} x2={x} y2={y} stroke={swatch} strokeWidth="1.3" />
        <ellipse
          cx={x}
          cy={cy - 8}
          rx="3"
          ry="6.5"
          fill="none"
          stroke={swatch}
          strokeWidth="1.15"
        />
        <ellipse
          cx={x + 7}
          cy={cy - 2}
          rx="3"
          ry="6.5"
          fill="none"
          stroke={swatch}
          strokeWidth="1.15"
          transform={`rotate(72 ${x} ${cy})`}
        />
        <ellipse
          cx={x + 4}
          cy={cy + 6}
          rx="3"
          ry="6.5"
          fill="none"
          stroke={swatch}
          strokeWidth="1.15"
          transform={`rotate(144 ${x} ${cy})`}
        />
        <ellipse
          cx={x - 4}
          cy={cy + 6}
          rx="3"
          ry="6.5"
          fill="none"
          stroke={swatch}
          strokeWidth="1.15"
          transform={`rotate(216 ${x} ${cy})`}
        />
        <ellipse
          cx={x - 7}
          cy={cy - 2}
          rx="3"
          ry="6.5"
          fill="none"
          stroke={swatch}
          strokeWidth="1.15"
          transform={`rotate(288 ${x} ${cy})`}
        />
        <circle cx={x} cy={cy} r="2.4" fill="none" stroke={swatch} strokeWidth="1.2" />
      </g>
    );
  }
  return (
    <g>
      <line x1={x} y1={y - 26} x2={x} y2={y} stroke={swatch} strokeWidth="1.3" />
      <ellipse
        cx={x - 7}
        cy={y - 18}
        rx="8"
        ry="4.5"
        fill="none"
        stroke={swatch}
        strokeWidth="1.2"
        transform={`rotate(-28 ${x - 7} ${y - 18})`}
      />
      <ellipse
        cx={x + 7}
        cy={y - 16}
        rx="8"
        ry="4.5"
        fill="none"
        stroke={swatch}
        strokeWidth="1.2"
        transform={`rotate(24 ${x + 7} ${y - 16})`}
      />
      <ellipse cx={x} cy={y - 28} rx="6" ry="3.5" fill="none" stroke={swatch} strokeWidth="1.1" />
    </g>
  );
}
