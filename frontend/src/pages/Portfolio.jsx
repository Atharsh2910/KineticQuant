import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'
import { motion } from 'framer-motion'
import { PieChart, Wallet, TrendingUp, IndianRupee, Activity, ChevronRight, BarChart3 } from 'lucide-react'

export default function Portfolio({ session }) {
  const [portfolioData, setPortfolioData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      setLoading(true)
      const { data: smes, error: smeError } = await supabase
        .from('sme_profiles')
        .select('*')
      
      if (smeError) throw smeError

      const { data: ledgers, error: ledgerError } = await supabase
        .from('financial_ledgers')
        .select('*')
      
      if (ledgerError) throw ledgerError

      // Map latest ledger to SME
      const enriched = (smes || []).map(sme => {
        const smeLedgers = (ledgers || [])
          .filter(l => l.sme_id === sme.id)
          .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
        return {
          ...sme,
          latestLedger: smeLedgers[0] || null
        }
      })
      
      setPortfolioData(enriched)
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCash = portfolioData.reduce((acc, sme) => acc + (sme.latestLedger?.cash_on_hand || 0), 0)
  const totalReceivables = portfolioData.reduce((acc, sme) => acc + (sme.latestLedger?.accounts_receivable || 0), 0)
  const totalPayables = portfolioData.reduce((acc, sme) => acc + (sme.latestLedger?.accounts_payable || 0), 0)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <AppLayout session={session}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Portfolio Allocation</h1>
        <p className="text-zinc-400">Detailed view of your current holdings, assets, and liabilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Wallet className="w-5 h-5 text-emerald-400" /></div>
            <h3 className="text-sm font-medium text-zinc-400">Total Cash Position</h3>
          </div>
          <p className="text-2xl font-bold text-white font-mono mt-2">
            Rs. {totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-400" /></div>
            <h3 className="text-sm font-medium text-zinc-400">Accounts Receivable</h3>
          </div>
          <p className="text-2xl font-bold text-white font-mono mt-2">
            Rs. {totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg"><PieChart className="w-5 h-5 text-orange-400" /></div>
            <h3 className="text-sm font-medium text-zinc-400">Accounts Payable</h3>
          </div>
          <p className="text-2xl font-bold text-white font-mono mt-2">
            Rs. {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" /> Asset Distribution
          </h2>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : portfolioData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400">No assets found in the portfolio.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50">
                  <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Entity</th>
                  <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Industry</th>
                  <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Cash on Hand</th>
                  <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">A/R</th>
                  <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">A/P</th>
                  <th className="py-4 px-6 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-white/5">
                {portfolioData.map((sme) => (
                  <motion.tr variants={itemVariants} key={sme.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{sme.name}</div>
                      <div className="text-xs text-zinc-500">{sme.id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/10">
                        {sme.industry_category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-emerald-400">
                      {sme.latestLedger ? `Rs. ${sme.latestLedger.cash_on_hand.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-blue-400">
                      {sme.latestLedger ? `Rs. ${sme.latestLedger.accounts_receivable.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-orange-400">
                      {sme.latestLedger ? `Rs. ${sme.latestLedger.accounts_payable.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Link to={`/sme/${sme.id}`} className="inline-flex items-center text-xs font-medium text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
