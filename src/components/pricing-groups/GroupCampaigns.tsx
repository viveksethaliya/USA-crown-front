'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, PlayCircle, PauseCircle, Archive, AlertCircle, HelpCircle } from 'lucide-react';
import CampaignEditor from './CampaignEditor';
import HelpDrawer from './HelpDrawer';

export default function GroupCampaigns({ group }: { group: any }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [group.id]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (campaignId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const currentCampaign = campaigns.find(c => c.id === campaignId);
      if (!currentCampaign) return;

      const res = await adminFetch(`/api/admin/pricing-groups/${group.id}/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ...currentCampaign, status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success(`Campaign marked as ${newStatus}`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 rounded-2xl shadow-sm p-8 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-[#312f2c]">Promotional Campaigns</h3>
            <button 
              onClick={() => setHelpOpen(true)}
              className="p-1.5 text-[#312f2c]/50 hover:bg-[#312f2c]/10 rounded-full transition-colors"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#312f2c]/50 text-sm mt-1 max-w-2xl">
            Group rules into a campaign to manage their lifecycle together. 
            All rules attached to a campaign will inherit its activation boundaries if applicable.
          </p>
        </div>
        <button 
          onClick={() => { setEditingCampaign(null); setIsEditorOpen(true); }}
          className="bg-[#312f2c] hover:bg-[#312f2c]/85 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-[#312f2c]/50 py-12">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#312f2c]/10 rounded-lg bg-[#312f2c]/5 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-[#312f2c]/40 mb-3" />
            <h4 className="text-lg font-medium text-[#312f2c]">No Campaigns</h4>
            <p className="text-[#312f2c]/50 mt-1 mb-4 text-sm max-w-sm">
              Create campaigns to organize and schedule a group of promotional rules.
            </p>
            <button 
              onClick={() => { setEditingCampaign(null); setIsEditorOpen(true); }}
              className="text-[#d1a054] font-medium hover:text-[#312f2c]"
            >
              + Create a campaign
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="border border-[#312f2c]/10 rounded-lg p-5 flex items-start justify-between bg-white">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-[#312f2c] text-lg">{camp.name}</h4>
                    {camp.status === 'active' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    )}
                    {camp.status === 'paused' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                        Paused
                      </span>
                    )}
                    {camp.status === 'draft' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#312f2c]/10 text-[#312f2c]/60">
                        Draft
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[#312f2c]/60 text-sm mt-2 mb-3">
                    {camp.description || 'No description provided.'}
                  </div>
                  
                  <div className="text-xs text-[#312f2c]/50 flex items-center gap-3">
                    <span>Starts: <strong className="text-[#312f2c]/80">{camp.starts_at ? new Date(camp.starts_at).toLocaleString() : 'Immediate'}</strong></span>
                    <span>•</span>
                    <span>Ends: <strong className="text-[#312f2c]/80">{camp.ends_at ? new Date(camp.ends_at).toLocaleString() : 'Never'}</strong></span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingCampaign(camp); setIsEditorOpen(true); }}
                    className="p-2 text-[#312f2c]/50 hover:text-[#d1a054] hover:bg-[#d1a054]/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {camp.status === 'active' ? (
                    <button 
                      onClick={() => handleUpdateStatus(camp.id, 'paused')}
                      className="p-2 text-[#312f2c]/50 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Pause"
                    >
                      <PauseCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpdateStatus(camp.id, 'active')}
                      className="p-2 text-[#312f2c]/50 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="Activate"
                    >
                      <PlayCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleUpdateStatus(camp.id, 'archived')}
                    className="p-2 text-[#312f2c]/50 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditorOpen && (
        <CampaignEditor 
          group={group}
          initialCampaign={editingCampaign}
          onClose={() => { setIsEditorOpen(false); setEditingCampaign(null); }}
          onSaved={() => {
            setIsEditorOpen(false);
            setEditingCampaign(null);
            fetchCampaigns();
          }}
        />
      )}

      <HelpDrawer isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Campaigns Tab Help">
        <p>The <strong>Campaigns</strong> tab allows you to organize multiple discount rules under a single umbrella initiative.</p>
        
        <h3>Why use Campaigns?</h3>
        <ul>
          <li><strong>Organization:</strong> If you have a &quot;Black Friday Sale&quot; that requires 10 different discount rules (e.g. 20% off widgets, 15% off gadgets, free shipping on bulk orders), you can attach all those rules to a &quot;Black Friday&quot; campaign.</li>
          <li><strong>Shared Scheduling:</strong> By setting a <em>Start Date</em> and <em>End Date</em> on a campaign, all rules attached to it will automatically become active or inactive at those specific times. This saves you from having to update dates on 10 different rules individually.</li>
          <li><strong>Easy Toggles:</strong> Pausing a campaign instantly pauses all of its associated rules. Activating the campaign brings them all back.</li>
        </ul>
      </HelpDrawer>
    </div>
  );
}
