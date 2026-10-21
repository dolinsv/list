import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from '../styles/app.module.css';
import type { ChartsData } from '../features/analytics/calculateCharts';

const COLORS = ['#0f6b5c', '#3d8f7d', '#7bb8a8', '#c4a35a', '#9b2c2c', '#5a6b62'];

function ChartBlock({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <article className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      {empty ? (
        <p className={styles.muted}>Недостаточно данных для графика.</p>
      ) : (
        <div style={{ width: '100%', height: 220 }}>{children}</div>
      )}
    </article>
  );
}

export function ChartsPanel({ data }: { data: ChartsData }) {
  return (
    <div className={styles.chartsGrid}>
      <ChartBlock title="Партнёры по уровням" empty={data.levels.length === 0}>
        <ResponsiveContainer>
          <BarChart data={data.levels}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f6b5c" name="Партнёры" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBlock>

      <ChartBlock
        title={`Непосредственные ветки (${data.branchMetricLabel})`}
        empty={data.directBranches.length === 0}
      >
        <ResponsiveContainer>
          <BarChart data={data.directBranches} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#3d8f7d" name={data.branchMetricLabel} radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBlock>

      <ChartBlock
        title="Распределение личных ББ"
        empty={data.personalBBDistribution.every((p) => p.value === 0)}
      >
        <ResponsiveContainer>
          <BarChart data={data.personalBBDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#7bb8a8" name="Партнёры" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBlock>

      <ChartBlock
        title="Топ личных ББ"
        empty={data.topPersonalBB.length === 0}
      >
        <ResponsiveContainer>
          <BarChart data={data.topPersonalBB} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#c4a35a" name="ББ личн" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartBlock>

      <ChartBlock
        title="Ненулевые и нулевые личные ББ"
        empty={data.nonzeroRatio.length === 0}
      >
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data.nonzeroRatio}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {data.nonzeroRatio.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartBlock>
    </div>
  );
}
