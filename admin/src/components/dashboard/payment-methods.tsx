"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PaymentMethodData {
  name: string;
  value: number;
  [key: string]: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface PaymentMethodsProps {
  data: PaymentMethodData[];
}

export function PaymentMethods({ data }: PaymentMethodsProps) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
     return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        Žiadne dáta o platbách.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36}/>
      </PieChart>
    </ResponsiveContainer>
  );
}
