import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ticket, Printer, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotspotProfile, HotspotProfilesResponse, HotspotServer, HotspotServersResponse } from "@/pages/HotspotPage";


interface VoucherFormData {
    count: number;
    profile: string;
    server: string;
    timeLimit: string;
    dataLimit: string;
    nameLength: number;
    passwordLength: number;
    characters: string;
    comment: string;
    prefixUsername: string;
    userMode: string;
  }
  
  interface GenerateVoucherResponse {
    success: boolean;
    message: string;
    data: {
      vouchers: Array<{
        username: string;
        password: string;
        profile: string;
        batchInfo?: {
          timeLimit?: string;
          dataLimit?: string;
          profile?: string;
          price?: string;
        };
      }>;
      price: string;
    };
  }

  
  type HotspotDnsNameResponse = {
    success: boolean;
    data: {
      dnsName: string;
    };
  }
  
  export const VoucherGeneratorModal = () => {
    const [open, setOpen] = useState(false);
    const [generatedVouchers, setGeneratedVouchers] = useState<GenerateVoucherResponse | null>(null);
    const routerId = localStorage.getItem('routerConnectionId');
  
    const defaultFormData: VoucherFormData = {
      count: 1,
      profile: '',
      server: 'all',
      timeLimit: '',
      dataLimit: '',
      nameLength: 6,
      passwordLength: 6,
      characters: 'uppercase_numbers',
      comment: '',
      prefixUsername: '',
      userMode: 'same',
    };
  
    const [formData, setFormData] = useState<VoucherFormData>(defaultFormData);
  
    const resetModal = () => {
      setFormData(defaultFormData);
      setGeneratedVouchers(null);
    };
  
    // Fetch hotspot DNS name
    const { data: hotspotDnsName } = useQuery<HotspotDnsNameResponse>({
      queryKey: ['hotspotDnsName', routerId],
      queryFn: async () => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-dns-name`);
        if (!response.ok) {
          throw new Error('Failed to fetch hotspot configuration');
        }
        return response.json();
      },
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!routerId && open
    });
  
    const { mutate: generateVouchersMutate, isPending } = useMutation<
      GenerateVoucherResponse,
      Error,
      VoucherFormData,
      unknown
    >({
      mutationFn: async (data: VoucherFormData) => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-vouchers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to generate vouchers');
        }
        
        return response.json();
      },
      onSuccess: (data) => {
        toast.success(`Successfully generated ${data.data.vouchers.length} voucher(s)`);
        setGeneratedVouchers(data);
        console.log("VOUCHERDATA", data);
      },
      onError: (error: Error) => {
        toast.error(`Failed to generate vouchers: ${error.message}`);
      },
    });
  
    // Fetch hotspot profiles
    const { data: hotspotProfiles } = useQuery<HotspotProfilesResponse>({
      queryKey: ['hotspotProfiles', routerId],
      queryFn: async () => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-profiles`);
        if (!response.ok) throw new Error('Failed to fetch hotspot profiles');
        return response.json();
      },
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!routerId && open
    });
  
    // Fetch hotspot servers
    const { data: hotspotServers } = useQuery<HotspotServersResponse>({
      queryKey: ['hotspotServers', routerId],
      queryFn: async () => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-servers`);
        if (!response.ok) throw new Error('Failed to fetch hotspot servers');
        return response.json();
      },
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!routerId && open
    });
  
    // Memoize profile and server names
    const { profileNames, serverNames } = useMemo(() => ({
      profileNames: hotspotProfiles?.data.profiles.map((profile: HotspotProfile) => profile.name) || [],
      serverNames: hotspotServers?.data.servers.map((server: HotspotServer) => server.name) || []
    }), [hotspotProfiles?.data.profiles, hotspotServers?.data.servers]);
  
    const handleInputChange = (field: keyof VoucherFormData, value: string | number): void => {
      setFormData((prevData: VoucherFormData): VoucherFormData => ({
        ...prevData,
        [field]: value
      }));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.profile) {
        toast.error('Please select a profile');
        return;
      }
      if (formData.count < 1 || formData.count > 100) {
        toast.error('Count must be between 1 and 100');
        return;
      }
      generateVouchersMutate(formData);
    };
  
    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow || !generatedVouchers) {
        toast.error('Please allow popups to print vouchers');
        return;
      }
  
      const { vouchers, price } = generatedVouchers.data;
  
      const voucherHTML = `
        <!DOCTYPE html>
  <html>
    <head>
      <title>WiFi Vouchers with DNS</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          margin: 0;
          padding: 10px;
          background-color: #ffffff;
        }
        
        .voucher-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .voucher {
          width: 250px;
          margin: 8px;
          background: white;
          border: 2px solid #000;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .header {
          background: #333;
          color: white;
          padding: 8px 0;
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #000;
        }
        
        .content {
          padding: 12px;
        }
        
        .credentials {
          width: 100%;
        }
        
        .credential-row {
          display: flex;
          margin-bottom: 6px;
          align-items: center;
          border-bottom: 1px dotted #999;
          padding-bottom: 6px;
        }
        
        .credential-label {
          min-width: 70px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .credential-value {
          font-size: 14px;
          font-weight: bold;
          font-family: monospace;
          letter-spacing: 0.5px;
          background: #eee;
          padding: 3px 6px;
          border-radius: 3px;
          border: 1px solid #999;
        }
        
        .price-section {
          margin-top: 10px;
          padding: 8px;
          border: 2px dashed #000;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .price-label {
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .price-amount {
          font-size: 18px;
          font-weight: bold;
        }
        
        .wifi-icon {
          display: inline-block;
          margin-right: 4px;
          vertical-align: -2px;
        }
        
        .dns-section {
          margin-top: 8px;
          padding: 5px;
          text-align: center;
          border-top: 1px solid #999;
        }
        
        .dns-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .dns-value {
          font-family: monospace;
          font-weight: bold;
          font-size: 13px;
        }
        
        @media print {
          @page {
            margin: 0.2cm;
            size: auto;
          }
          body {
            background: white;
          }
          .voucher {
            page-break-inside: avoid;
            margin: 5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .voucher-container {
            justify-content: flex-start;
          }
          .header {
            background-color: #333 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="voucher-container">
        ${vouchers.map((voucher) => `
        <div class="voucher">
          <div class="header">
            <svg class="wifi-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            WIFI VOUCHER
          </div>
          <div class="content">
              <div class="credentials">
                <div class="credential-row">
                  <div class="credential-label">Profile:</div>
                  <div class="credential-value">${voucher.profile}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Username:</div>
                  <div class="credential-value">${voucher.username}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Password:</div>
                  <div class="credential-value">${voucher.password}</div>
                </div>
              </div>
            
              <div class="price-section">
                <div class="price-label">PRICE</div>
                <div class="price-amount">${price} LRD</div>
              </div>
              
              <div class="dns-section">
                <div class="dns-label">Connect at</div>
                <div class="dns-value">${hotspotDnsName?.data?.dnsName || ''}</div>
              </div>
          </div>
        </div>
        `).join('')}
      </div>
    </body>
  </html>
      `;
  
      printWindow.document.write(voucherHTML);
      printWindow.document.close();
      printWindow.print();
    };
  
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          resetModal();
        }
      }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="bg-white/50 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm transition-all duration-300">
            <Ticket className="w-4 h-4 mr-2 text-blue-600" />
            Generate Voucher
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] w-[800px] bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 rounded-2xl" />
          
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Generate Vouchers
            </DialogTitle>
            <Tabs defaultValue={generatedVouchers ? "vouchers" : "general"} className="w-full">
              <TabsList className="grid w-full grid-cols-3 p-1 bg-gray-100/50 rounded-xl">
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="general"
                  disabled={isPending}
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="limits"
                  disabled={isPending}
                >
                  Limits
                </TabsTrigger>
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="vouchers"
                  disabled={!generatedVouchers}
                >
                  Vouchers
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-4">
                <TabsContent value="general">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.count}
                        onChange={(e) => handleInputChange('count', parseInt(e.target.value))}
                        className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Profile</label>
                      <Select
                        value={formData.profile}
                        onValueChange={(value) => handleInputChange('profile', value)}
                      >
                        <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                          <SelectValue placeholder="Select profile" />
                        </SelectTrigger>
                        <SelectContent>
                          {profileNames.map((profile: string) => (
                            <SelectItem key={profile} value={profile}>
                              {profile}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Server</label>
                      <Select
                        value={formData.server}
                        onValueChange={(value) => handleInputChange('server', value)}
                      >
                        <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                          <SelectValue placeholder="Select server" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {serverNames.map((server) => (
                            <SelectItem key={server} value={server}>
                              {server}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">User Mode</label>
                      <Select
                        value={formData.userMode}
                        onValueChange={(value) => handleInputChange('userMode', value)}
                      >
                        <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                          <SelectValue placeholder="Select user mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="same">Same Credentials</SelectItem>
                          <SelectItem value="different">Different Credentials</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Name Length</label>
                      <Input
                        type="number"
                        min="4"
                        max="12"
                        value={formData.nameLength}
                        onChange={(e) => handleInputChange('nameLength', parseInt(e.target.value))}
                        className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Prefix</label>
                      <Input
                        value={formData.prefixUsername}
                        onChange={(e) => handleInputChange('prefixUsername', e.target.value)}
                        className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Characters</label>
                      <Select
                        value={formData.characters}
                        onValueChange={(value) => handleInputChange('characters', value)}
                      >
                        <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                          <SelectValue placeholder="Select character type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uppercase_numbers">Uppercase & Numbers</SelectItem>
                          <SelectItem value="lowercase_numbers">Lowercase & Numbers</SelectItem>
                          <SelectItem value="numbers">Numbers Only</SelectItem>
                          <SelectItem value="all">All Characters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Comment</label>
                      <Input
                        value={formData.comment}
                        onChange={(e) => handleInputChange('comment', e.target.value)}
                        className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="limits">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Time Limit</label>
                      <Input
                        placeholder="e.g., 1h, 30m, 1d"
                        value={formData.timeLimit}
                        onChange={(e) => handleInputChange('timeLimit', e.target.value)}
                        className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Data Limit</label>
                      <Input
                        placeholder="e.g. 200K, 200M, 1G, 10T"
                        value={formData.dataLimit}
                        onChange={(e) => handleInputChange('dataLimit', e.target.value)}
                        className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vouchers">
                  {generatedVouchers && (
                    <div>
                      <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                        {generatedVouchers.data.vouchers.map((voucher, index) => (
                          <div key={index} className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="text-center font-bold text-sm mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                              WiFi Voucher
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Username</span>
                                <span className="font-mono font-bold text-sm text-gray-900">{voucher.username}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Password</span>
                                <span className="font-mono font-bold text-sm text-gray-900">{voucher.password}</span>
                              </div>
                              <div className="border-t border-dashed border-gray-200 my-2"></div>
                              <div className="text-center text-xs text-gray-500">
                                {hotspotDnsName?.data?.dnsName}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          type="button"
                          onClick={handlePrint}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print Vouchers
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <div className="flex justify-end space-x-3 mt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setOpen(false);
                      resetModal();
                    }}
                    className="bg-white/50 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm transition-all duration-300"
                  >
                    Close
                  </Button>
                  {!generatedVouchers && (
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Ticket className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Tabs>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  };
  