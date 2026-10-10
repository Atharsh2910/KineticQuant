import { AppLayout } from '../components/layout/AppLayout'

export default function Portfolio({ session }) {
  return (
    <AppLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Portfolio</h1>
        <p className="text-zinc-400">Detailed view of your current holdings and assets.</p>
      </div>
      <div className="glass-panel rounded-xl p-12 text-center border-dashed">
        <p className="text-zinc-400">Portfolio module is currently under development.</p>
      </div>
    </AppLayout>
  )
}

