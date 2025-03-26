export default function EdgeLabel({ transform, label }: { transform: string; label: string }) {
    return (
        <div
            style={{
                position: 'absolute',
                background: '#F7F9FB',
                padding: 0,
                color: 'black',
                fontSize: 8,
                fontWeight: 500,
                transform,
            }}
            className="nodrag nopan"
        >
            {label}
        </div>
    );
}