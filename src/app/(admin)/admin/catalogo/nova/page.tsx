import MediaForm from "@/components/admin/MediaForm";
import { createMedia } from "../../actions";

export default function NewMediaPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Cadastrar nova obra</h1>
      <MediaForm action={createMedia} submitLabel="Cadastrar obra" />
    </>
  );
}
