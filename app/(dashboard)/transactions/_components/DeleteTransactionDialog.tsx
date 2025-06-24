import { TransactionType } from "@/app/types/transaction";
import { AlertDescription } from "@/components/ui/alert";
import {
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";
import { DeleteCategory } from "../../_actions/categories";
import { DeleteTransaction } from "../_actions/deleteTransaction";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  transactionId: string;
}
function DeleteTransactionDialog({ open, setOpen, transactionId }: Props) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: DeleteTransaction,
    onSuccess: async () => {
      toast.success("Transaction deleted successfully", {
        id: transactionId,
      });

      // Invalidate and refetch all related queries
      await queryClient.invalidateQueries({
        queryKey: ["transaction-history"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["overview"],
        exact: false,
      });
      await queryClient.invalidateQueries({ queryKey: ["stats"] });
      await queryClient.invalidateQueries({ queryKey: ["history-data"] });

      // Force immediate refetch
      await queryClient.refetchQueries({
        queryKey: ["transaction-history"],
        exact: false,
      });
      await queryClient.refetchQueries({
        queryKey: ["overview"],
        exact: false,
      });
    },
    onError: () => {
      toast.error("Failed to delete transaction", { id: transactionId });
    },
  });
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this transaction?
          </AlertDialogTitle>
          <AlertDescription>
            This action cannot be undone. This will permanently delete the
            category and remove it from your account.
          </AlertDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              toast.loading("Deleting transaction...", {
                id: transactionId,
              });
              deleteMutation.mutate(transactionId);
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteTransactionDialog;
