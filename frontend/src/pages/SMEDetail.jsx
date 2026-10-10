import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateFuse } from '../lib/api'
import { AppLayout } from '../components/layout/AppLayout'
import { ArrowLeft, Play, AlertCircle, FileText, TrendingUp, BarChart3, Clock, DollarSign } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

export default function SMEDetail({ session }) {
  const { id } = useParams()
  const [sme, setSme] = useState(null)
  const [ledgers, setLedgers] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchSMEDetails()
  }, [id])

  const fetchSMEDetails = async () => {
    try {
      setLoading(true)
      
      const [smeRes, ledgerRes, historyRes] = await Promise.all([
        supabase.from('sme_profiles').select('*').eq('id', id).single(),
        supabase.from('financial_ledgers').select('*').eq('sme_id', id).order('recorded_at', { ascending: false }).limit(10),
        supabase.from('fuse_score_history').select('*').eq('sme_id', id).order('calculated_at', { ascending: false })
      ])

      if (smeRes.error) throw smeRes.error
      setSme(smeRes.data)
      setLedgers(ledgerRes.data || [])
      setHistory(historyRes.data || [])
    } catch (error) {
      console.error('Error fetching SME details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateFuse = async () => {
    setCalculating(true)
    try {
      await calculateFuse(id, session.user.id)
      await fetchSMEDetails()
    } catch (error) {
      alert("Error calculating Fuse Score: " + error.message)
    } finally {
      setCalculating(false)
    }
  }

  const chartData = ledgers.map(l => ({
    date: new Date(l.recorded_at).toLocaleDateString(),
    cash: parseFloat(l.cash_on_hand),
    payable: parseFloat(l.accounts_payable),
    receivable: parseFloat(l.accounts_receivable)
  })).reverse()

  const currentScore = history.length > 0 ? history[0] : null
  const prevScore = history.length > 1 ? history[1] : null
  const scoreChange = currentScore && prevScore ? (currentScore.fuse_score - prevScore.fuse_score).toFixed(2) : 0

  if (loading) return (
    <AppLayout session={session}>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </AppLayout>
  )

  if (!sme) return (
    <AppLayout session={session}>
      <div className="glass-panel p-8 text-center text-red-400">SME not found or unauthorized.</div>
    </AppLayout>
  )

  return (
    <AppLayout session={session}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="p-2 mr-4 rounded-lg bg-slate-800 border border-white/5 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{sme.name}</h1>
            <div className="flex items-center mt-1 text-sm text-slate-400 space-x-3">
              <span className="flex items-center"><Building2 className="w-4 h-4 mr-1" /> {sme.industry_category}</span>
              <span>•</span>
              <span className="font-mono text-xs">ID: {sme.id.split('-')[0]}...</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCalculateFuse}
          disabled={calculating}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all transform active:scale-95"
        >
          <Play className={cn("w-4 h-4 mr-2", calculating && "animate-pulse")} fill="currentColor" />
          {calculating ? 'Processing AI Models...' : 'Run Fuse Engine'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Liquidity Runway
              </h2>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div> Cash</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div> Receivable</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div> Payable</span>
              </div>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="cash" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
                  <Area type="monotone" dataKey="receivable" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="payable" stroke="#EF4444" strokeWidth={2} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield className="w-32 h-32" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Current Fuse Score</h3>
              {currentScore ? (
                <>
                  <div className="flex items-baseline mb-2">
                    <span className="text-6xl font-bold text-white tracking-tighter tabular-nums">{parseFloat(currentScore.fuse_score).toFixed(1)}</span>
                    <span className="text-lg text-slate-500 ml-2">/ 100</span>
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    {scoreChange > 0 ? (
                      <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +{scoreChange}
                      </span>
                    ) : scoreChange < 0 ? (
                      <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded flex items-center">
                        <TrendingDown className="w-3 h-3 mr-1" /> {scoreChange}
                      </span>
                    ) : (
                      <span className="text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded">No change</span>
                    )}
                    <span className="text-slate-500 ml-2">since last run</span>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-500 border border-dashed border-white/10 rounded-lg">
                  No score generated yet.
                </div>
              )}
            </div>
            
            {currentScore && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Base Risk (Deterministic)</span>
                  <span className="text-white font-mono">{parseFloat(currentScore.base_score).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">ML Delta (LSTM/SARIMAX)</span>
                  <span className="text-white font-mono">{parseFloat(currentScore.delta_score).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">NLP Multiplier (Groq)</span>
                  <span className={cn("font-mono", currentScore.sentiment_multiplier > 1 ? "text-emerald-400" : currentScore.sentiment_multiplier < 1 ? "text-red-400" : "text-slate-300")}>
                    {parseFloat(currentScore.sentiment_multiplier).toFixed(2)}x
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="flex border-b border-white/5 bg-slate-900/50">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn("px-6 py-4 text-sm font-medium transition-colors relative", activeTab === 'overview' ? "text-white" : "text-slate-400 hover:text-white")}
          >
            Ledger History
            {activeTab === 'overview' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
          </button>
          <button 
            onClick={() => setActiveTab('cot')}
            className={cn("px-6 py-4 text-sm font-medium transition-colors relative", activeTab === 'cot' ? "text-white" : "text-slate-400 hover:text-white")}
          >
            Chain of Thought (CoT) Logs
            {activeTab === 'cot' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 rounded-lg">
                  <tr>
                    <th className="px-6 py-3 font-medium rounded-l-lg">Date Recorded</th>
                    <th className="px-6 py-3 font-medium text-right">Cash on Hand</th>
                    <th className="px-6 py-3 font-medium text-right">A/R</th>
                    <th className="px-6 py-3 font-medium text-right">A/P</th>
                    <th className="px-6 py-3 font-medium text-right rounded-r-lg">Inventory Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgers.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {new Date(l.recorded_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-emerald-400">
                        ${parseFloat(l.cash_on_hand).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-blue-400">
                        ${parseFloat(l.accounts_receivable).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-red-400">
                        ${parseFloat(l.accounts_payable).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 font-mono text-right text-slate-400">
                        ${parseFloat(l.inventory_holding_costs).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'cot' && (
            <div className="space-y-6">
              {history.length === 0 ? (
                <div className="text-center text-slate-500 py-8">No AI analysis history available.</div>
              ) : (
                history.map((record) => (
                  <div key={record.id} className="bg-slate-800/30 rounded-lg border border-white/5 p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center text-slate-300 font-mono text-sm">
                        <Clock className="w-4 h-4 mr-2 text-slate-500" />
                        {new Date(record.calculated_at).toLocaleString()}
                      </div>
                      <div className="font-mono text-lg font-bold text-white">Score: {record.fuse_score}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <h4 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">Deterministic Engine</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{record.cot_explanation.deterministic_cot}</p>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <h4 className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">Predictive Engine (ML)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{record.cot_explanation.predictive_cot}</p>
                      </div>
                      <div className="bg-slate-900/50 p-4 rounded border border-white/5">
                        <h4 className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">NLP Sentiment (Groq)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed italic">"{record.cot_explanation.nlp_cot}"</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function Shield(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
function TrendingDown(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  )
}
