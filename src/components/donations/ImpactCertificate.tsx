import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, ExternalLink, Loader2 } from 'lucide-react';
import { SolanaIcon } from '@/components/icons/SolanaIcon';
import { mintCertificateNft } from '@/services/apiService';

interface ImpactCertificateProps {
  userName?: string;
  totalDonated: number;
  ngoName?: string;
  txSignature?: string;
  cluster?: string;
  date?: Date;
  onClose?: () => void;
  existingNft?: {
    mintAddress: string;
    explorerUrl: string;
    imageUrl?: string;
  } | null;
}

interface MintedNft {
  mintAddress: string;
  explorerUrl: string;
  imageUrl: string;
}

// Estimate: $1 = 0.1 kg CO2 offset (simplified for demo)
const CO2_PER_DOLLAR = 0.1;

export function ImpactCertificate({
  userName = 'Eco Champion',
  totalDonated,
  ngoName,
  txSignature,
  cluster = 'devnet',
  date = new Date(),
  onClose,
  existingNft
}: ImpactCertificateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintedNft, setMintedNft] = useState<MintedNft | null>(
    existingNft ? {
      mintAddress: existingNft.mintAddress,
      explorerUrl: existingNft.explorerUrl,
      imageUrl: existingNft.imageUrl || ''
    } : null
  );
  const [mintError, setMintError] = useState<string | null>(null);

  const co2Offset = (totalDonated * CO2_PER_DOLLAR).toFixed(1);
  const explorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}?cluster=${cluster}`
    : null;
  const shortTx = txSignature ? `${txSignature.slice(0, 8)}...${txSignature.slice(-8)}` : null;

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
    const text = `I just helped offset ${co2Offset} kg of CO2 through @EcoscoreApp! ${ngoName ? `Supporting ${ngoName}. ` : ''}Verified on Solana blockchain. #ClimateAction #Sustainability #Web3ForGood`;
    const url = explorerUrl || 'https://ecoscore.app';

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  }

  async function handleShareInstagram() {
    // Instagram doesn't support direct web sharing
    // Best approach: download image + copy caption, then prompt user
    const blob = await generateImage();
    if (!blob) return;

    // Download the image
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecoscore-impact-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Copy caption to clipboard
    const caption = `I just helped offset ${co2Offset} kg of CO2 through Ecoscore! ${ngoName ? `Supporting ${ngoName}. ` : ''}Verified on Solana blockchain.\n\n#ClimateAction #Sustainability #Web3ForGood #Ecoscore`;

    try {
      await navigator.clipboard.writeText(caption);
      alert('Image downloaded! Caption copied to clipboard. Open Instagram and paste the caption with your image.');
    } catch {
      alert('Image downloaded! Open Instagram and share your impact certificate.');
    }
  }

  async function handleMintNft() {
    setIsMinting(true);
    setMintError(null);

    try {
      const result = await mintCertificateNft(totalDonated, ngoName, txSignature);

      if (result.success) {
        setMintedNft({
          mintAddress: result.certificate.mintAddress,
          explorerUrl: result.certificate.explorerUrl,
          imageUrl: result.certificate.imageUrl
        });
      } else {
        setMintError(result.error || 'Failed to mint NFT');
      }
    } catch (error: any) {
      setMintError(error.message || 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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

        {/* Certificate Card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-green-600 via-emerald-500 to-teal-600 rounded-xl p-0.5"
        >
          <div className="bg-white rounded-xl p-4 text-center">
            {/* Header */}
            <div className="mb-2">
              <div className="text-2xl mb-1">🌍</div>
              <h2 className="text-base font-bold text-gray-800">ECOSCORE IMPACT</h2>
              <div className="h-0.5 w-12 bg-gradient-to-r from-green-500 to-teal-500 mx-auto mt-1 rounded-full" />
            </div>

            {/* Impact Stats */}
            <div className="my-3">
              <p className="text-gray-600 text-xs">{userName} helped offset</p>
              <p className="text-3xl font-bold text-green-600">{co2Offset} kg</p>
              <p className="text-gray-600 text-sm">of CO2 emissions</p>
            </div>

            {/* Donation Details */}
            <div className="bg-gray-50 rounded-lg p-2 mb-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">Amount Donated</span>
                <span className="font-bold text-green-600">${totalDonated.toFixed(2)}</span>
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
              <p className="text-purple-600 text-xs">Verified on Solana</p>
              {shortTx && (
                <p className="text-xs text-gray-400 font-mono">{shortTx}</p>
              )}
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

        {/* Mint NFT Section */}
        {mintedNft ? (
          <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <SolanaIcon className="w-4 h-4" />
              <span className="font-semibold">NFT Minted!</span>
            </div>
            <a
              href={mintedNft.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              View on Solana Explorer
            </a>
          </div>
        ) : (
          <div className="mt-3">
            <Button
              onClick={handleMintNft}
              disabled={isMinting}
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm"
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <SolanaIcon className="w-3 h-3 mr-1" />
                  Mint as NFT
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
            disabled={isGenerating}
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
