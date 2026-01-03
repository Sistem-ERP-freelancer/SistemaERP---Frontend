import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Plus, Truck, Loader2 } from 'lucide-react';
import { useCarriers } from '@/hooks/useCarriers';
import { CarrierTable } from '@/components/carriers/CarrierTable';
import { CarrierForm } from '@/components/carriers/CarrierForm';
import { DeleteCarrierDialog } from '@/components/carriers/DeleteCarrierDialog';
import { CarrierOrdersDialog } from '@/components/carriers/CarrierOrdersDialog';
import { SearchInput } from '@/components/carriers/SearchInput';
import { Pagination } from '@/components/carriers/Pagination';
import { CarrierStats } from '@/components/carriers/CarrierStats';

export default function Transportadoras() {
  const {
    carriers,
    totalCarriers,
    currentPage,
    totalPages,
    searchTerm,
    selectedCarrier,
    carrierToDelete,
    orders,
    isLoading,
    isFormOpen,
    isDeleteDialogOpen,
    isOrdersDialogOpen,
    isCreating,
    isUpdating,
    setCurrentPage,
    handleSearch,
    createCarrier,
    updateCarrier,
    deleteCarrier,
    toggleCarrierStatus,
    handleStatusChange,
    updatingStatusId,
    getOrdersByCarrier,
    openCreateForm,
    openEditForm,
    openDeleteDialog,
    openOrdersDialog,
    closeForm,
    closeDeleteDialog,
    closeOrdersDialog,
  } = useCarriers();

  const handleSubmit = (data: any) => {
    if (selectedCarrier) {
      updateCarrier(selectedCarrier.id, data);
    } else {
      createCarrier(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (carrierToDelete) {
      deleteCarrier(carrierToDelete);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transportadoras</h1>
            <p className="text-muted-foreground">
              Gestão de transportadoras do ERP
            </p>
          </div>
        </div>

        <div>
          {/* Estatísticas */}
          <CarrierStats carriers={carriers} />

          {/* Barra de Ações */}
          <div className="bg-card border rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Buscar por nome ou CNPJ..."
                />
              </div>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Transportadora
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-card border rounded-xl p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CarrierTable
                  carriers={carriers}
                  onEdit={openEditForm}
                  onDelete={openDeleteDialog}
                  onStatusChange={handleStatusChange}
                  updatingStatusId={updatingStatusId}
                  onViewOrders={openOrdersDialog}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCarriers}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>

        {/* Modais */}
        <CarrierForm
          isOpen={isFormOpen}
          onClose={closeForm}
          onSubmit={handleSubmit}
          carrier={selectedCarrier}
          isPending={isCreating || isUpdating}
        />

        <DeleteCarrierDialog
          isOpen={isDeleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
          carrier={carrierToDelete}
        />

        <CarrierOrdersDialog
          isOpen={isOrdersDialogOpen}
          onClose={closeOrdersDialog}
          carrier={selectedCarrier}
          orders={selectedCarrier ? getOrdersByCarrier(selectedCarrier.id) : []}
        />
      </div>
    </AppLayout>
  );
}
