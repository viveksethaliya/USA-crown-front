'use client';
import React, { useState, useEffect } from 'react';
import { UsersRound, Layout, Shield, Tag, Calendar, Activity, Eye, FileText, ArrowLeft, Info } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import GroupOverview from '@/components/pricing-groups/GroupOverview';
import GroupCustomers from '@/components/pricing-groups/GroupCustomers';
import GroupAccess from '@/components/pricing-groups/GroupAccess';
import GroupRules from '@/components/pricing-groups/GroupRules';
import GroupCampaigns from '@/components/pricing-groups/GroupCampaigns';
import GroupPreview from '@/components/pricing-groups/GroupPreview';
import GroupHistory from '@/components/pricing-groups/GroupHistory';
import toast from 'react-hot-toast';

type GroupData = {
  id: number;
  name: string;
  status: string;
  group_type: string;
  member_count?: number;
};

export default function PricingGroupDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'access' | 'base' | 'promotions' | 'campaigns' | 'preview' | 'history'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchGroup = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await adminFetch(`/api/admin/pricing-groups/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedGroup(data.group);
        } else {
          toast.error("Group not found");
          router.push('/crown-admin/pricing-groups');
        }
      } catch (error) {
        console.error('Failed to fetch group', error);
        toast.error("Failed to load group");
        router.push('/crown-admin/pricing-groups');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroup();
  }, [id, router]);

  const handleGroupUpdate = (updatedGroup: any) => {
    setSelectedGroup(prev => prev ? { ...prev, ...updatedGroup } : null);
  };

  if (loading) {
    return <div className="p-8 text-[#312f2c]/50 animate-pulse">Loading group details...</div>;
  }

  if (!selectedGroup) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden -m-4 sm:m-0">
      <div className="flex-1 flex flex-col bg-[#312f2c]/5 h-full overflow-hidden rounded-3xl border border-white/50 bg-white/40 shadow-sm">
        {/* Header */}
        <div className="bg-white/40 backdrop-blur-2xl border-b border-[#312f2c]/10 p-6 shadow-sm z-10 shrink-0">
          <div className="mb-4">
            <Link href="/crown-admin/pricing-groups" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#312f2c]/60 hover:text-[#d1a054] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Pricing Groups
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-[#312f2c]">{selectedGroup.name}</h1>
              <p className="text-sm text-[#312f2c]/50 mt-1">Manage rules, customers, and campaigns for this group.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedGroup.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                selectedGroup.status === 'draft' ? 'bg-[#312f2c]/10 text-[#312f2c]/80' : 'bg-amber-100 text-amber-700'
              }`}>
                {selectedGroup.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[
              { id: 'overview', icon: Layout, label: 'Overview' },
              { id: 'customers', icon: UsersRound, label: 'Customers' },
              { id: 'access', icon: Shield, label: 'Product Access' },
              { id: 'rules', icon: Tag, label: 'Discount Rules' },
              { id: 'campaigns', icon: Calendar, label: 'Campaigns' },
              { id: 'preview', icon: Eye, label: 'Preview' },
              { id: 'history', icon: Activity, label: 'History' },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#d1a054]/10 text-[#d1a054] border-b-2 border-[#d1a054]'
                      : 'text-[#312f2c]/60 hover:text-[#312f2c] hover:bg-[#312f2c]/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {activeTab === 'overview' && (
            <GroupOverview group={selectedGroup} onUpdate={handleGroupUpdate} />
          )}
          {activeTab === 'customers' && (
            <GroupCustomers group={selectedGroup} />
          )}
          {activeTab === 'access' && (
            <GroupAccess group={selectedGroup} />
          )}
          {activeTab === 'rules' && (
            <GroupRules group={selectedGroup} />
          )}
          {activeTab === 'campaigns' && (
            <GroupCampaigns group={selectedGroup} />
          )}
          {activeTab === 'preview' && (
            <GroupPreview group={selectedGroup} />
          )}
          {activeTab === 'history' && (
            <GroupHistory group={selectedGroup} />
          )}
        </div>
      </div>
    </div>
  );
}
