import { AppLayout } from '../components/layout/AppLayout'
import { Settings as SettingsIcon, Bell, Shield, Key, Database, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Settings({ session }) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <AppLayout session={session}>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Settings</h1>
          <p className="text-zinc-400">Manage your account preferences and system configurations.</p>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20 font-medium text-sm transition-colors text-left">
            <SettingsIcon className="w-4 h-4" /> General Preferences
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors text-left">
            <Key className="w-4 h-4" /> API Integrations
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors text-left">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors text-left">
            <Shield className="w-4 h-4" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors text-left">
            <Database className="w-4 h-4" /> Data Management
          </button>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  disabled 
                  value={session?.user?.email || ''} 
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-zinc-500 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Organization Name</label>
                <input 
                  type="text" 
                  defaultValue="KineticQuant Capital"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Default Currency</label>
                <select className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50 appearance-none">
                  <option value="INR">INR (Rs.)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
              <button className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-orange-500/20">
                Save Changes
              </button>
            </div>
          </div>
          
          <div className="glass-panel rounded-xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-sm font-medium text-white">Backend API</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Operational</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-sm font-medium text-white">Groq AI Inference Engine</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Operational</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-sm font-medium text-white">Supabase Database</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
