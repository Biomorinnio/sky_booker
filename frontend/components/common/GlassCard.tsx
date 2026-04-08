type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={`bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 rounded-2xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
