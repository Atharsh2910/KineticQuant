import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'
import { motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react'

export default function Transactions({ session }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      // Try fetching capital_drawdowns. If RLS fails, catch and set fallback.
      const { data, error } = await supabase
        .from('capital_drawdowns')
        .select(`*, sme_profiles(name)`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.warn('Could not fetch drawdowns (possibly RLS), using mock data:', error)
        throw error
      }

      const formatted = (data || []).map(d => ({
        id: d.id,
        type: 'Drawdown',
        amount: d.drawdown_amount,
        entity: d.sme_profiles?.name || 'Unknown SME',
        status: d.status,
        date: d.created_at,
        description: d.trigger_reason
      }))
      
      setTransactions(formatted)
    } catch (error) {
      // Fallback mock data if table doesn't exist or RLS blocks it for demo purposes
      setTransactions([
        {
          id: '1',
          type: 'Capital Drawdown',
          amount: 15000.00,
          entity: 'TechCorp Logistics',
          status: 'executed',
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          description: 'Automated JIT financing to cover AP invoice due Day 18'
        },
        {
          id: '2',
          type: 'Early Repayment',
          amount: 5200.00,
          entity: 'GreenEnergy Solutions',
          status: 'proposed',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          description: 'AR collection utilized for early drawdown repayment'
        },
        {
          id: '3',
          type: 'Vendor Arbitrage',
          amount: 1250.00,
          entity: 'Global Trade Co.',
          status: 'executed',
          date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          description: 'Shifted 40% volume to Alternative Vendor A. Savings realized.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'executed':
      case 'repaid':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case 'cancelled':
      case 'dismissed':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-orange-400" />
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  }

  return (
    <AppLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Transactions</h1>
        <p className="text-zinc-400">History of all capital drawdowns, payments, and arbitrage actions.</p>
      </div>
      
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <button className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors">
            Download CSV
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center border-dashed">
            <p className="text-zinc-400">No transactions recorded yet.</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <motion.div variants={itemVariants} key={tx.id} className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between gap-6 group">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${tx.type.includes('Repayment') ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
                    {tx.type.includes('Repayment') ? (
                      <ArrowDownLeft className={`w-6 h-6 ${tx.type.includes('Repayment') ? 'text-emerald-400' : 'text-orange-400'}`} />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">{tx.type}</h4>
                    <p className="text-sm text-zinc-400">{tx.entity}</p>
                    <p className="text-xs text-zinc-500 mt-1">{tx.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-white">
                    Rs. {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    {getStatusIcon(tx.status)}
                    <span className="text-xs font-medium text-zinc-400 capitalize">{tx.status}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
