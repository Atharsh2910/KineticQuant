import { AppLayout } from '../components/layout/AppLayout'
import { motion } from 'framer-motion'
import { Target, TrendingUp, ShieldCheck, Zap } from 'lucide-react'

export default function Goals({ session }) {
  const goals = [
    {
      id: 1,
      title: "Maintain Portfolio Liquidity > Rs. 5M",
      description: "Ensure total aggregate cash reserves across all SMEs do not fall below the safety threshold.",
      progress: 85,
      icon: <Target className="w-5 h-5 text-blue-400" />,
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Average Fuse Score Target: 85+",
      description: "Optimize financial health of the supply chain to maintain a low-risk profile.",
      progress: 92,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      color: "bg-emerald-500"
    },
    {
      id: 3,
      title: "JIT Financing Arbitrage Returns",
      description: "Target 12% annualized yield on early payment discount operations.",
      progress: 45,
      icon: <TrendingUp className="w-5 h-5 text-orange-400" />,
      color: "bg-orange-500"
    },
    {
      id: 4,
      title: "Autonomous Action Efficiency",
      description: "Percentage of AI-proposed actions successfully executed without manual intervention.",
      progress: 68,
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      color: "bg-purple-500"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  }

  return (
    <AppLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Goals & Targets</h1>
        <p className="text-zinc-400">Track your financial targets and automated liquidity milestones.</p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <motion.div variants={itemVariants} key={goal.id} className="glass-panel rounded-xl p-6 relative overflow-hidden group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-800/80 rounded-lg border border-white/5 shadow-inner">
                  {goal.icon}
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {goal.title}
                </h3>
              </div>
              <span className="text-xl font-bold font-mono text-white">{goal.progress}%</span>
            </div>
            
            <p className="text-sm text-zinc-400 mb-6 min-h-[40px]">
              {goal.description}
            </p>
            
            <div className="relative h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`absolute top-0 left-0 h-full ${goal.color}`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 glass-panel rounded-xl p-8 border-dashed flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-zinc-800 rounded-full mb-4">
          <Target className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Create New Goal</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          Set custom thresholds for portfolio health, financing targets, or automated strategy execution limits.
        </p>
        <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors border border-white/10">
          Define Target
        </button>
      </div>
    </AppLayout>
  )
}
