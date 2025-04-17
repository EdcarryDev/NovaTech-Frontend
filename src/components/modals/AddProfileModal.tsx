import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, UserPlus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";  
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotspotProfile } from "@/pages/HotspotPage";

interface IPPool {
    name: string;
    ranges: string;
    nextPool: string;
}

interface IPPoolsResponse {
    success: boolean;
    data: IPPool[];
}  

interface AddProfileModalProps {
    isEditing?: boolean;
    profileToEdit?: HotspotProfile | null;
    onClose?: () => void;
  }
  
  interface FormData {
    name: string;
    addressPool: string;
    sharedUsers: number;
    rateLimit: string;
    parentQueue: string;
    expiredMode: string;
    validity: string;
    price: string;
    selling_price: string;
    lockUser: "enabled" | "disabled";
    lockServer: "enabled" | "disabled";
  }

interface AddProfileModalProps {
    isEditing?: boolean;
    profileToEdit?: HotspotProfile | null;
  }

export const AddProfileModal: React.FC<AddProfileModalProps> = ({ isEditing = false, profileToEdit = null }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const routerId = localStorage.getItem('routerConnectionId');
    
    const [formData, setFormData] = useState<FormData>({
      name: '',
      addressPool: '',
      sharedUsers: 0,
      rateLimit: '',
      parentQueue: '',
      expiredMode: '',
      validity: '',
      price: '0',
      selling_price: '0',
      lockUser: 'disabled',
      lockServer: 'disabled'
    });

    // Fetch IP pools
    const { data: ipPools, isLoading: isLoadingPools, error: poolsError } = useQuery<IPPoolsResponse>({
      queryKey: ['ipPools', routerId],
      queryFn: async () => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/ip-pools`);
        if (!response.ok) throw new Error('Failed to fetch IP pools');
        return response.json();
      },
      enabled: !!routerId && open,
    });

    // Set form data when editing an existing profile
    useEffect(() => {
      if (isEditing && profileToEdit) {
        setFormData({
          name: profileToEdit.name || '',
          addressPool: profileToEdit.address_pool || '',
          sharedUsers: Number(profileToEdit.shared_users) || 0,
          rateLimit: profileToEdit.rate_limit || '',
          parentQueue: profileToEdit.parent_queue || '',
          expiredMode: profileToEdit.expire_mode || '',
          validity: profileToEdit.validity || '',
          price: String(profileToEdit.price || '0'),
          selling_price: String(profileToEdit.selling_price || '0'),
          lockUser: profileToEdit.user_lock || 'disabled',
          lockServer: profileToEdit.server_lock || 'disabled'
        });
      }
    }, [isEditing, profileToEdit]);

    const handleInputChange = (field: string, value: string | number) => {
      setFormData((prev: FormData) => ({
        ...prev,
        [field]: value
      }));
    };

    const resetForm = () => {
      setFormData({
        name: '',
        addressPool: '',
        sharedUsers: 0,
        rateLimit: '',
        parentQueue: '',
        expiredMode: '',
        validity: '',
        price: '0',
        selling_price: '0',
        lockUser: 'disabled',
        lockServer: 'disabled'
      });
    };

    // Update profile mutation
    const updateProfile = useMutation({
      mutationFn: async (data: FormData) => {
        if (!routerId || !profileToEdit) throw new Error('No router connected or no profile to edit');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-profiles/${profileToEdit.name}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update profile');
        }
        return response.json();
      },
      onSuccess: () => {
        resetForm();
        setOpen(false);
        toast.success('Profile updated successfully');
        queryClient.invalidateQueries({ queryKey: ['hotspotProfiles'] });
      },
      onError: (error: Error) => {
        toast.error(`Failed to update profile: ${error.message}`);
      },
    });

    // Create profile mutation
    const createProfile = useMutation({
      mutationFn: async (data: FormData) => {
        if (!routerId) throw new Error('No router connected');
        const response = await fetch(`http://localhost:3001/api/router/${routerId}/hotspot-profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create profile');
        }
        return response.json();
      },
      onSuccess: () => {
        resetForm();
        setOpen(false);
        toast.success('Profile created successfully');
        queryClient.invalidateQueries({ queryKey: ['hotspotProfiles'] });
      },
      onError: (error: Error) => {
        toast.error(`Failed to create profile: ${error.message}`);
      },
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name) {
        toast.error('Please fill in the profile name');
        return;
      }
      
      if (!formData.price || !formData.selling_price) {
        toast.error('Both price and selling price are required');
        return;
      }
      
      if (formData.price === '0' || formData.selling_price === '0') {
        toast.error('Price and selling price must be greater than 0');
        return;
      }
      
      if (isNaN(Number(formData.price)) || isNaN(Number(formData.selling_price))) {
        toast.error('Price and selling price must be valid numbers');
        return;
      }
      
      if (isEditing) {
        updateProfile.mutate(formData);
      } else {
        createProfile.mutate(formData);
      }
    };

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {isEditing ? (
            <Button variant="outline" className="bg-white/50 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm transition-all duration-300">
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
          ) : (
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Profile
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="h-fit overflow-y-auto bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-2xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 rounded-2xl" />
          
          <DialogHeader className="relative space-y-4">
            <div className="flex items-center">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {isEditing ? 'Edit Profile' : 'Add Profile'}
              </DialogTitle>
            </div>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100/50 rounded-xl">
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="general"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  className="outline-none border-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:bg-white/50" 
                  value="details"
                >
                  Details
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-6">
                <TabsContent value="general" className="space-y-6">
                  <div className="w-full space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Name</label>
                        <Input 
                          placeholder="Enter profile name" 
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Address Pool</label>
                        <Select
                          value={formData.addressPool}
                          onValueChange={(value) => handleInputChange('addressPool', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select address pool" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingPools ? (
                              <SelectItem value="loading" disabled>Loading pools...</SelectItem>
                            ) : poolsError ? (
                              <SelectItem value="error" disabled>Error loading pools</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="none">none</SelectItem>
                                {ipPools?.data.map((pool: IPPool) => (
                                  <SelectItem key={pool.name} value={pool.name}>
                                    {pool.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Shared Users</label>
                        <Input 
                          type="number"
                          min="1"
                          placeholder="Enter number of shared users" 
                          value={formData.sharedUsers}
                          onChange={(e) => handleInputChange('sharedUsers', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Rate Limit</label>
                        <Input 
                          placeholder="Enter rate limit (e.g., 5M/5M)" 
                          value={formData.rateLimit}
                          onChange={(e) => handleInputChange('rateLimit', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Parent Queue</label>
                        <Select
                          value={formData.parentQueue}
                          onValueChange={(value) => handleInputChange('parentQueue', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select parent queue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="queue1">Queue 1</SelectItem>
                            <SelectItem value="queue2">Queue 2</SelectItem>
                            <SelectItem value="queue3">Queue 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6">
                  <div className="w-full space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Expire Mode</label>
                        <Select
                          value={formData.expiredMode}
                          onValueChange={(value) => handleInputChange('expiredMode', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select expire mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="Remove">Remove</SelectItem>
                            <SelectItem value="Notice">Notice</SelectItem>
                            <SelectItem value="Remove & Record">Remove & Record</SelectItem>
                            <SelectItem value="Notice & Record">Notice & Record</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.expiredMode !== 'none' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Validity</label>
                          <Input 
                            placeholder="Enter validity (e.g., 5d, 1w, 1m)" 
                            value={formData.validity}
                            onChange={(e) => handleInputChange('validity', e.target.value)}
                            className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Price</label>
                        <Input 
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Enter price" 
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Selling Price</label>
                        <Input 
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Enter selling price" 
                          value={formData.selling_price}
                          onChange={(e) => handleInputChange('selling_price', e.target.value)}
                          className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">User Lock</label>
                        <Select
                          value={formData.lockUser}
                          onValueChange={(value) => handleInputChange('lockUser', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select user lock" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Enabled</SelectItem>
                            <SelectItem value="no">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Server Lock</label>
                        <Select
                          value={formData.lockServer}
                          onValueChange={(value) => handleInputChange('lockServer', value)}
                        >
                          <SelectTrigger className="w-full bg-white/50 border-gray-200/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300">
                            <SelectValue placeholder="Select server lock" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <div className="flex justify-end space-x-3 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      if (!isEditing) resetForm();
                    }}
                    className="bg-white/50 hover:bg-white/60 border border-gray-200/50 backdrop-blur-sm transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    disabled={isEditing ? updateProfile.isPending : createProfile.isPending}
                  >
                    {isEditing ? (
                      updateProfile.isPending ? (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Pencil className="w-4 h-4 mr-2" />
                          Update Profile
                        </>
                      )
                    ) : (
                      createProfile.isPending ? (
                        <>
                          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Profile
                        </>
                      )
                    )}
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
};