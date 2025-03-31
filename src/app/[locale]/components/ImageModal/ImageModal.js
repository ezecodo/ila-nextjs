import { Dialog } from "@headlessui/react";
import Image from "next/image";
import styles from "./ImageModal.module.css";

export default function ImageModal({
  isOpen,
  imageUrl,
  onClose,
  title = "",
  alt = "",
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-70"
    >
      <Dialog.Panel className={styles.modalPanel}>
        {imageUrl && (
          <>
            {/* Imagen */}
            <Image
              src={imageUrl}
              alt={alt}
              width={500}
              height={700}
              objectFit="contain"
              className={styles.modalImage}
            />
            {/* Título y Alt */}
            <div className={styles.imageCaption}>
              {title && <h3 className={styles.imageTitle}>{title}</h3>}
              {alt && <p className={styles.imageAlt}>{alt}</p>}
            </div>
          </>
        )}
        {/* Botón de cierre */}
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
      </Dialog.Panel>
    </Dialog>
  );
}
