import React, { useEffect, useRef } from 'react';

interface ModalProps {
    label: string;
    onClose: () => void;
    children: React.ReactNode;
}

/** Native <dialog>: centred on desktop, bottom sheet on phones (see App.css). */
export const Modal: React.FC<ModalProps> = ({ label, onClose, children }) => {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) dialog.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            className="modal"
            aria-label={label}
            onCancel={e => {
                e.preventDefault();
                onClose();
            }}
            onClick={e => {
                if (e.target === ref.current) onClose();
            }}
        >
            <div className="modal-body">{children}</div>
        </dialog>
    );
};
