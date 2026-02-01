import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NgoCard } from '@/components/donations/NgoCard';
import { PledgeForm } from '@/components/donations/PledgeForm';
import { DonationHistory } from '@/components/donations/DonationHistory';
import { ImpactCertificate } from '@/components/donations/ImpactCertificate';
import { getNgos, getPledges, createPledge, getPointsBalance, getDonationStats, devGrantPoints, getWeeklyPledgesByNgo, devProcessBatch, devFillVault, getBatchReceipts, getSponsors } from '@/services/apiService';
import { ExternalLink, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

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
  const [allTimeStats, setAllTimeStats] = useState<any>(null);
  const [allTimeByNgo, setAllTimeByNgo] = useState<any[]>([]);
  const [weeklyPledges, setWeeklyPledges] = useState<any>(null);
  const [batchReceipts, setBatchReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPledgeForm, setShowPledgeForm] = useState(false);
  const [showImpactCert, setShowImpactCert] = useState(false);
  const [selectedPledgeForCert, setSelectedPledgeForCert] = useState<any>(null);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [showSponsors, setShowSponsors] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ngosRes, pledgesRes, balanceRes, statsRes, weeklyRes, batchRes, sponsorsRes] = await Promise.all([
        getNgos(),
        getPledges().catch(() => ({ pledges: [] })),
        getPointsBalance().catch(() => ({ balance: 0 })),
        getDonationStats().catch(() => ({ stats: {}, byNgo: [] })),
        getWeeklyPledgesByNgo().catch(() => ({ byNgo: [], totalPoints: 0 })),
        getBatchReceipts(10).catch(() => ({ donations: [] })),
        getSponsors().catch(() => ({ sponsors: [] }))
      ]);

      setNgos(ngosRes.ngos || []);
      setPledges(pledgesRes.pledges || []);
      setBalance(balanceRes.balance || 0);
      setAllTimeStats(statsRes.stats || {});
      setAllTimeByNgo(statsRes.byNgo || []);
      setWeeklyPledges(weeklyRes);
      setBatchReceipts(batchRes.donations || []);
      setSponsors(sponsorsRes.sponsors || []);
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
      // Refresh pledges and weekly stats
      const [pledgesRes, weeklyRes] = await Promise.all([
        getPledges(),
        getWeeklyPledgesByNgo()
      ]);
      setPledges(pledgesRes.pledges || []);
      setWeeklyPledges(weeklyRes);
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
    <div className="container mx-auto px-4 py-6 pb-32 max-w-4xl">
      {/* Dev Controls */}
      {import.meta.env.DEV && (
        <div className="mb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const result = await devGrantPoints(1000);
                setBalance(result.newBalance);
              } catch (e) {
                console.error('Failed to grant points:', e);
              }
            }}
            className="flex-1 border-dashed border-orange-300 text-orange-600 text-xs"
          >
            [dev] +1000 pts
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const result = await devFillVault(0.5);
                alert(`Vault funded! Balance: ${result.vaultBalance?.sol} SOL`);
              } catch (e: any) {
                console.error('Fill vault failed:', e);
                alert(`Fill vault failed: ${e.message}`);
              }
            }}
            className="flex-1 border-dashed border-green-300 text-green-600 text-xs"
          >
            [dev] Fill Vault
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const result = await devProcessBatch();
                console.log('Batch result:', result);
                loadData();
                alert(`Batch processed! TX: ${result.receipt?.txSignature || 'N/A'}`);
              } catch (e: any) {
                console.error('Batch failed:', e);
                alert(`Batch failed: ${e.message}`);
              }
            }}
            className="flex-1 border-dashed border-purple-300 text-purple-600 text-xs"
          >
            [dev] Process Batch
          </Button>
        </div>
      )}

      {/* Your Stats */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your Balance</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-green-600">{balance.toLocaleString()}</p>
            <p className="text-gray-500">points</p>
            <p className="text-lg text-gray-400 ml-2">(${((balance || 0) / 100).toFixed(2)})</p>
          </div>
        </CardContent>
      </Card>

      {/* Impact Certificate Modal */}
      {showImpactCert && selectedPledgeForCert && (
        <ImpactCertificate
          totalDonated={selectedPledgeForCert.totalDonated}
          ngoName={selectedPledgeForCert.ngoName}
          txSignature={selectedPledgeForCert.txSignature}
          cluster="devnet"
          onClose={() => {
            setShowImpactCert(false);
            setSelectedPledgeForCert(null);
          }}
        />
      )}

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
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="donate">Donate</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="donate">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Choose an NGO to Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Our partner brands fund the donation vault when you choose their sustainable products.
                Your points direct where these funds go - straight to verified climate organizations via Solana blockchain.
              </p>

              {/* Sponsors Dropdown */}
              <button
                onClick={() => setShowSponsors(!showSponsors)}
                className="flex items-center gap-2 text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                View Partner Brands Funding the Vault
                {showSponsors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSponsors && (
                <div className="mt-4 space-y-3">
                  {sponsors.length > 0 ? (
                    sponsors.map((sponsor: any) => (
                      <div
                        key={sponsor._id}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border">
                            {sponsor.logoUrl ? (
                              <img src={sponsor.logoUrl} alt={sponsor.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{sponsor.name}</p>
                            <div className="flex items-center gap-2">
                              {sponsor.websiteUrl && (
                                <a
                                  href={sponsor.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-purple-600 hover:underline"
                                >
                                  Website
                                </a>
                              )}
                              {sponsor.walletAddress && (
                                <a
                                  href={`https://explorer.solana.com/address/${sponsor.walletAddress}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                >
                                  Wallet <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <a
                            href={sponsor.walletAddress ? `https://explorer.solana.com/address/${sponsor.walletAddress}?cluster=devnet` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-purple-600 hover:underline"
                          >
                            ${(sponsor.totalDepositedUsd || 0).toLocaleString()}
                          </a>
                          <p className="text-xs text-gray-500">contributed</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No partner brands yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {ngos.map((ngo) => {
              // Find weekly stats for this NGO
              const ngoWeeklyStats = weeklyPledges?.byNgo?.find(
                (item: any) => item.ngo?._id === ngo._id
              );
              return (
                <NgoCard
                  key={ngo._id}
                  ngo={ngo}
                  onSelect={handleSelectNgo}
                  selected={selectedNgo?._id === ngo._id}
                  weeklyStats={ngoWeeklyStats}
                />
              );
            })}
          </div>

          {ngos.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No NGOs available at the moment
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats">
          {/* Weekly Stats */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyPledges?.byNgo?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {weeklyPledges.byNgo.map((item: any) => (
                      <div key={item.ngo?._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border">
                            {item.ngo?.logoUrl ? (
                              <img src={item.ngo.logoUrl} alt={item.ngo.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>🌱</span>
                            )}
                          </div>
                          <p className="font-medium text-sm">{item.ngo?.name || 'Unknown'}</p>
                        </div>
                        <p className="font-bold text-green-600">${item.estimatedUsd?.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-gray-600">Total this week:</span>
                    <span className="font-bold text-green-600">${weeklyPledges.totalEstimatedUsd?.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">No pledges yet this week</p>
              )}
            </CardContent>
          </Card>

          {/* All-Time Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All-Time</CardTitle>
            </CardHeader>
            <CardContent>
              {allTimeByNgo?.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {allTimeByNgo.map((ngo: any) => (
                      <div key={ngo._id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border">
                            {ngo.logoUrl ? (
                              <img src={ngo.logoUrl} alt={ngo.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>🌱</span>
                            )}
                          </div>
                          <p className="font-medium text-sm">{ngo.name}</p>
                        </div>
                        <p className="font-bold text-purple-600">${ngo.totalReceivedUsd?.toFixed(2) || '0.00'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-gray-600">Total all-time:</span>
                    <span className="font-bold text-purple-600">${allTimeStats?.totalDonationsUsd?.toFixed(2) || '0.00'}</span>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">No donations processed yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <DonationHistory
            pledges={pledges}
            onPledgeClick={(pledge) => {
              if (pledge.status === 'completed') {
                setSelectedPledgeForCert({
                  totalDonated: pledge.estimatedUsd || 0,
                  ngoName: pledge.ngo?.name,
                  txSignature: pledge.txSignature,
                });
                setShowImpactCert(true);
              }
            }}
          />

          {/* Global Batch History */}
          {batchReceipts.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Global Batch Disbursements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {batchReceipts.map((batch: any) => (
                  <a
                    key={batch.txSignature}
                    href={batch.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {batch.ngoCount} NGO{batch.ngoCount > 1 ? 's' : ''} received funds
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(batch.processedAt).toLocaleDateString()} · {batch.totalPointsRedeemed.toLocaleString()} points
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600">${batch.totalUsd?.toFixed(2)}</span>
                        <ExternalLink className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {batch.allocations?.slice(0, 3).map((alloc: any) => (
                        <span key={alloc.ngoId} className="text-xs bg-white px-2 py-0.5 rounded">
                          {alloc.ngoName}: ${alloc.usdAllocated?.toFixed(2)}
                        </span>
                      ))}
                      {batch.allocations?.length > 3 && (
                        <span className="text-xs text-gray-500">+{batch.allocations.length - 3} more</span>
                      )}
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

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
