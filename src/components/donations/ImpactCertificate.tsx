import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, X, ExternalLink, Loader2, Check, Lock } from 'lucide-react';
import { SolanaIcon } from '@/components/icons/SolanaIcon';
import { mintCertificateNft, getMilestones } from '@/services/apiService';

interface MilestoneInfo {
  amount: number;
  unlocked: boolean;
  minted: boolean;
  available: boolean;
}

interface ImpactCertificateProps {
  userName?: string;
  totalDonated: number;
  ngoName?: string;
  txSignature?: string;
  cluster?: string;
  date?: Date;
  onClose?: () => void;
}

// Milestone badge names and icons
const MILESTONE_META: Record<number, { name: string; icon: string; color: string }> = {
  5: { name: 'Seedling', icon: '🌱', color: 'from-green-400 to-emerald-500' },
  25: { name: 'Sapling', icon: '🌿', color: 'from-emerald-500 to-teal-500' },
  50: { name: 'Tree', icon: '🌳', color: 'from-teal-500 to-cyan-500' },
  100: { name: 'Forest Guardian', icon: '🌲', color: 'from-cyan-500 to-blue-500' }
};

// Estimate: $1 = 0.1 kg CO2 offset
const CO2_PER_DOLLAR = 0.1;

export function ImpactCertificate({
  userName = 'Eco Champion',
  totalDonated,
  ngoName,
  txSignature,
  cluster = 'devnet',
  date = new Date(),
  onClose
}: ImpactCertificateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<MilestoneInfo[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [justMinted, setJustMinted] = useState<{ milestone: number; explorerUrl: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, []);

  async function loadMilestones() {
    try {
      const res = await getMilestones();
      setMilestones(res.milestones || []);
      // Auto-select the highest available (unminted) milestone
      const available = (res.milestones || []).filter((m: MilestoneInfo) => m.available);
      if (available.length > 0) {
        setSelectedMilestone(available[available.length - 1].amount);
      }
    } catch (e) {
      console.error('Failed to load milestones:', e);
    } finally {
      setLoading(false);
    }
  }

  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=${cluster}`
    : null;

  async function generateImage(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload() {
    const blob = await generateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoscore-impact-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleShareX() {
    const milestone = selectedMilestone || milestones.find(m => m.minted)?.amount || 5;
    const meta = MILESTONE_META[milestone];
    const co2 = (milestone * CO2_PER_DOLLAR).toFixed(1);
    const text = `${meta?.icon} I just earned my "${meta?.name}" badge on @EcoscoreApp! Helped offset ${co2} kg of CO2. ${ngoName ? `Supporting ${ngoName}. ` : ''}#ClimateAction #Sustainability #Web3ForGood`;
    const url = justMinted?.explorerUrl || explorerUrl || 'https://ecoscore.app';

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  }

  async function handleShareInstagram() {
    const blob = await generateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoscore-badge-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const milestone = selectedMilestone || 5;
    const meta = MILESTONE_META[milestone];
    const co2 = (milestone * CO2_PER_DOLLAR).toFixed(1);
    const caption = `${meta?.icon} Just earned my "${meta?.name}" badge on Ecoscore! Helped offset ${co2} kg of CO2.\n\n#ClimateAction #Sustainability #Web3ForGood #Ecoscore`;

    try {
      await navigator.clipboard.writeText(caption);
      alert('Image downloaded! Caption copied to clipboard. Open Instagram and paste the caption with your image.');
    } catch {
      alert('Image downloaded! Open Instagram and share your impact badge.');
    }
  }

  async function handleMintNft() {
    if (!selectedMilestone) return;

    setIsMinting(true);
    setMintError(null);

    try {
      const result = await mintCertificateNft(selectedMilestone, ngoName, txSignature);

      if (result.success) {
        setJustMinted({
          milestone: selectedMilestone,
          explorerUrl: result.certificate.explorerUrl
        });
        // Refresh milestones to update UI
        await loadMilestones();
      } else {
        setMintError(result.error || 'Failed to mint NFT');
      }
    } catch (error: any) {
      setMintError(error.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  }

  const selectedMeta = selectedMilestone ? MILESTONE_META[selectedMilestone] : null;
  const hasAvailableMilestones = milestones.some(m => m.available);
  const mintedCount = milestones.filter(m => m.minted).length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="text-white flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 px-4 py-2 overflow-y-auto">
      <div className="max-w-sm w-full">
        {/* Close button */}
        {onClose && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Milestone Badges Grid */}
        <div className="mb-4">
          <h3 className="text-white text-sm font-semibold mb-2 text-center">
            Your Impact Badges
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {milestones.map((m) => {
              const meta = MILESTONE_META[m.amount];
              const isSelected = selectedMilestone === m.amount;
              return (
                <button
                  key={m.amount}
                  onClick={() => m.available && setSelectedMilestone(m.amount)}
                  disabled={!m.available && !m.minted}
                  className={`
                    relative p-2 rounded-xl text-center transition-all
                    ${m.minted
                      ? 'bg-gradient-to-br ' + meta.color + ' text-white shadow-lg'
                      : m.available
                        ? isSelected
                          ? 'bg-white ring-2 ring-green-500 shadow-lg'
                          : 'bg-white/90 hover:bg-white'
                        : 'bg-gray-600/80'
                    }
                  `}
                >
                  <div className={`text-2xl ${!m.unlocked ? 'grayscale opacity-60' : ''}`}>{meta.icon}</div>
                  <div className={`text-xs font-bold ${m.minted ? 'text-white' : m.unlocked ? 'text-gray-800' : 'text-gray-300'}`}>
                    ${m.amount}
                  </div>
                  <div className={`text-[10px] ${m.minted ? 'text-white/80' : m.unlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                    {meta.name}
                  </div>
                  {/* Status indicator */}
                  {m.minted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {!m.unlocked && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Badge Preview */}
        {selectedMilestone && selectedMeta && (
          <div
            ref={cardRef}
            className={`bg-gradient-to-br ${selectedMeta.color} rounded-xl p-0.5`}
          >
            <div className="bg-white rounded-xl p-4 text-center">
              {/* Badge Icon */}
              <div className="text-5xl mb-2">{selectedMeta.icon}</div>

              {/* Badge Name */}
              <h2 className="text-lg font-bold text-gray-800">{selectedMeta.name} Badge</h2>
              <div className="h-0.5 w-12 bg-gradient-to-r from-green-500 to-teal-500 mx-auto mt-1 rounded-full" />

              {/* Stats */}
              <div className="my-3">
                <p className="text-gray-600 text-xs">{userName} reached</p>
                <p className="text-3xl font-bold text-green-600">${selectedMilestone}</p>
                <p className="text-gray-600 text-sm">donation milestone</p>
              </div>

              {/* CO2 Impact */}
              <div className="bg-gray-50 rounded-lg p-2 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">CO2 Offset</span>
                  <span className="font-bold text-green-600">
                    {(selectedMilestone * CO2_PER_DOLLAR).toFixed(1)} kg
                  </span>
                </div>
                {ngoName && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-500 text-xs">Supporting</span>
                    <span className="font-medium text-gray-800 text-xs">{ngoName}</span>
                  </div>
                )}
              </div>

              {/* Verification */}
              <div className="border-t pt-2">
                <p className="text-purple-600 text-xs flex items-center justify-center gap-1">
                  <SolanaIcon className="w-3 h-3" /> Verified on Solana
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Branding */}
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-400">ecoscore.app</p>
              </div>
            </div>
          </div>
        )}

        {/* Just Minted Success */}
        {justMinted && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <Check className="w-4 h-4" />
              <span className="font-semibold">
                {MILESTONE_META[justMinted.milestone]?.name} Badge Minted!
              </span>
            </div>
            <a
              href={justMinted.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              View on Solana Explorer
            </a>
          </div>
        )}

        {/* Mint Button */}
        {hasAvailableMilestones && !justMinted && selectedMilestone && (
          <div className="mt-3">
            <Button
              onClick={handleMintNft}
              disabled={isMinting || !milestones.find(m => m.amount === selectedMilestone)?.available}
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm"
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Minting {MILESTONE_META[selectedMilestone]?.name}...
                </>
              ) : (
                <>
                  <SolanaIcon className="w-3 h-3 mr-1" />
                  Mint {MILESTONE_META[selectedMilestone]?.name} Badge (${selectedMilestone})
                </>
              )}
            </Button>
            {mintError && (
              <p className="text-red-500 text-xs mt-1 text-center">{mintError}</p>
            )}
          </div>
        )}


        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <Button
            onClick={handleDownload}
            disabled={isGenerating || !selectedMilestone}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-100 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Save
          </Button>

          <Button
            onClick={handleShareX}
            disabled={isGenerating}
            size="sm"
            className="bg-black hover:bg-gray-800 text-white text-xs"
          >
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Post
          </Button>

          <Button
            onClick={handleShareInstagram}
            disabled={isGenerating}
            size="sm"
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white text-xs"
          >
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ImpactCertificate;
