import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { syncMarketData } from '../lib/api'
import { AppLayout } from '../components/layout/AppLayout'
import { RefreshCw, TrendingUp, DollarSign, Activity, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Dashboard({ session }) {
  const [smes, setSmes] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchSMEs()
  }, [])

  const fetchSMEs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sme_profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSmes(data || [])
    } catch (error) {
      console.error('Error fetching SMEs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncMarket = async () => {
    setSyncing(true)
    try {
      await syncMarketData()
      // Optional: show toast notification
    } catch (error) {
      console.error("Failed to sync market data:", error)
    } finally {
      setSyncing(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <AppLayout session={session}>
      {/* Hero Metrics Header */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Portfolio Overview</h1>
            <p className="text-slate-400">Welcome back. Here's your portfolio's current standing.</p>
          </div>
          <button
            onClick={handleSyncMarket}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing Market...' : 'Sync Market Data'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="w-16 h-16" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">Total AUM</p>
            <p className="text-3xl font-bold text-white font-mono tracking-tight">$42,500,000</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-400 flex items-center bg-emerald-400/10 px-2 py-0.5 rounded font-medium">
                <TrendingUp className="w-3 h-3 mr-1" /> +14.2%
              </span>
              <span className="text-slate-500 ml-2">vs last month</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-16 h-16" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">Active SMEs</p>
            <p className="text-3xl font-bold text-white font-mono tracking-tight">{smes.length}</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-400 flex items-center bg-blue-400/10 px-2 py-0.5 rounded font-medium">
                Active Portfolio
              </span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-16 h-16" />
            </div>
            <p className="text-sm font-medium text-slate-400 mb-1">Avg. Fuse Score</p>
            <p className="text-3xl font-bold text-white font-mono tracking-tight">84.2</p>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-400 flex items-center bg-emerald-400/10 px-2 py-0.5 rounded font-medium">
                Low Risk
              </span>
              <span className="text-slate-500 ml-2">portfolio average</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">SME Entities</h2>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Filter SMEs..." 
            className="pl-3 pr-10 py-1.5 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : smes.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 text-center border-dashed">
          <p className="text-slate-400 mb-2">Your portfolio is currently empty.</p>
          <p className="text-xs text-slate-500 font-mono">{session.user.id}</p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {smes.map((sme) => (
            <motion.div key={sme.id} variants={itemVariants}>
              <Link
                to={`/sme/${sme.id}`}
                className="block glass-card rounded-xl p-6 group h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {sme.name}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Industry</span>
                    <span className="text-xs font-medium text-slate-300 bg-slate-800 px-2 py-1 rounded-md border border-white/5">
                      {sme.industry_category}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Dependencies</span>
                    <div className="flex gap-1">
                      {sme.supply_chain_dependencies?.slice(0,2).map(dep => (
                        <span key={dep} className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          {dep}
                        </span>
                      ))}
                      {sme.supply_chain_dependencies?.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{sme.supply_chain_dependencies.length - 2}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Added {new Date(sme.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AppLayout>
  )
}
