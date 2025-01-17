import { Dialog } from "@headlessui/react"; // Modal de Headless UI
import Image from "next/image";
import styles from "./ImageModal.module.css";

export default function ImageModal({ isOpen, imageUrl, onClose }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
    >
      <Dialog.Panel className={styles.modalPanel}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt="Imagen ampliada"
            width={500} // Tamaño ajustado
            height={700}
            objectFit="contain"
          />
        )}
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </Dialog.Panel>
    </Dialog>
  );
}
