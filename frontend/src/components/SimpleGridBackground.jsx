export default function SimpleGridBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-screen w-full overflow-hidden">
      {/* Base Gradients */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, #050B18 0%, #0A192F 45%, #050B18 100%)',
        }}
      />

      {/* Simple Grid Pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(6,182,212,0.08), transparent 60%)',
        }}
      />
    </div>
  )
}
