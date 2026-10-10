import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Copy, ExternalLink } from 'lucide-react'
import { generatePassport, listPassports } from '../../lib/api'

export default function CreditPassportPanel({ smeId }) {
  const [passports, setPassports] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchPassports = async () => {
    setLoading(true)
    try {
      const res = await listPassports(smeId)
      setPassports(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPassports()
  }, [smeId])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generatePassport(smeId)
      await fetchPassports()
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token)
    // alert('Token copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Dynamic Credit Passports</h3>
          <p className="text-sm text-slate-400">Shareable financial health badges powered by real-time data.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg disabled:opacity-50"
        >
          <BadgeCheck className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
          {generating ? 'Generating...' : 'Generate New Passport'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
      ) : passports.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-500">No active credit passports.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {passports.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-indigo-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <BadgeCheck className="w-24 h-24 text-indigo-400" />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-white font-bold">{p.financial_health_summary.sme_name}</h4>
                    <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Verified Health Passport</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Fuse Score</p>
                    <p className="text-2xl font-bold font-mono text-white">{parseFloat(p.fuse_score_snapshot).toFixed(1)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500">Quick Ratio</p>
                    <p className="text-sm font-mono text-slate-300">{p.financial_health_summary.quick_ratio.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Cash Position</p>
                    <p className="text-sm font-mono text-emerald-400">{p.financial_health_summary.cash_position_indicator}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-slate-400">
                    Valid until: {new Date(p.valid_until).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyToken(p.passport_token)} className="flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded transition-colors text-slate-300" title="Copy Shareable Token">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.open(`/api/v1/passport/verify/${p.passport_token}`, '_blank')} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded transition-colors text-xs font-medium">
                      <ExternalLink className="w-3 h-3" /> View Data
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

