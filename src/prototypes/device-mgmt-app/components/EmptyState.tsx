import React from 'react';

type EmptyStateProps = {
    message: string;
};

export default function EmptyState({ message }: EmptyStateProps) {
    return <div className="dma-empty">{message}</div>;
}
