export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "warning" | "success";
}) => (
  <div
    className={`border border-border rounded-lg p-6 ${
      variant === "warning"
        ? "bg-destructive/5"
        : variant === "success"
          ? "bg-primary/5"
          : "bg-card"
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          variant === "warning"
            ? "bg-destructive/10"
            : variant === "success"
              ? "bg-primary/10"
              : "bg-muted"
        }`}
      >
        {Icon}
      </div>
      {trend && (
        <div
          className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
    <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
    <div className="text-3xl font-bold mb-1">{value}</div>
    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
  </div>
);