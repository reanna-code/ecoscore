import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NgoCard } from '@/components/donations/NgoCard';
import { PledgeForm } from '@/components/donations/PledgeForm';
import { DonationHistory } from '@/components/donations/DonationHistory';
import { getNgos, getPledges, createPledge, getPointsBalance, getDonationStats } from '@/services/apiService';

interface Ngo {
  _id: string;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  walletAddress: string;
  categories: string[];
  totalReceivedUsd: number;
  donationCount: number;
}

export function DonationsScreen() {
  const [ngos, setNgos] = useState<Ngo[]>([]);
  const [pledges, setPledges] = useState<any[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<Ngo | null>(null);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPledgeForm, setShowPledgeForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ngosRes, pledgesRes, balanceRes, statsRes] = await Promise.all([
        getNgos(),
        getPledges().catch(() => ({ pledges: [] })),
        getPointsBalance().catch(() => ({ balance: 0 })),
        getDonationStats().catch(() => ({ stats: {} }))
      ]);

      setNgos(ngosRes.ngos || []);
      setPledges(pledgesRes.pledges || []);
      setBalance(balanceRes.balance || 0);
      setStats(statsRes.stats || {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePledge(points: number) {
    if (!selectedNgo) return;

    const result = await createPledge(selectedNgo._id, points);

    if (result.success) {
      setBalance(result.newBalance);
      setShowPledgeForm(false);
      setSelectedNgo(null);
      // Refresh pledges
      const pledgesRes = await getPledges();
      setPledges(pledgesRes.pledges || []);
    } else {
      throw new Error(result.error);
    }
  }

  function handleSelectNgo(ngo: Ngo) {
    setSelectedNgo(ngo);
    setShowPledgeForm(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{balance.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Your Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              ${((balance || 0) / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Donation Power</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-600">
              ${stats?.totalDonationsUsd?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500">Total Donated</p>
          </CardContent>
        </Card>
      </div>

      {/* Pledge Form Modal */}
      {showPledgeForm && selectedNgo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PledgeForm
            ngoName={selectedNgo.name}
            ngoId={selectedNgo._id}
            userBalance={balance}
            onSubmit={handlePledge}
            onCancel={() => {
              setShowPledgeForm(false);
              setSelectedNgo(null);
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="donate" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="donate">Donate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="donate">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose an NGO to Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Your points are converted to real donations, sent directly to these climate organizations
                via the Solana blockchain. Every transaction is publicly verifiable.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {ngos.map((ngo) => (
              <NgoCard
                key={ngo._id}
                ngo={ngo}
                onSelect={handleSelectNgo}
                selected={selectedNgo?._id === ngo._id}
              />
            ))}
          </div>

          {ngos.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No NGOs available at the moment
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <DonationHistory pledges={pledges} />

          {/* On-chain verification info */}
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  ⛓️
                </div>
                <div>
                  <p className="font-medium">Powered by Solana</p>
                  <p className="text-sm text-gray-500">
                    All donations are processed on-chain and publicly verifiable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DonationsScreen;
