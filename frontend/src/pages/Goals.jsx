import { AppLayout } from '../components/layout/AppLayout'

export default function Goals({ session }) {
  return (
    <AppLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Goals</h1>
        <p className="text-zinc-400">Track your financial targets and liquidity milestones.</p>
      </div>
      <div className="glass-panel rounded-xl p-12 text-center border-dashed">
        <p className="text-zinc-400">Goals module is currently under development.</p>
      </div>
    </AppLayout>
  )
}

