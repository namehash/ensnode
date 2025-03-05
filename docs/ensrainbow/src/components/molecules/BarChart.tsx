interface BarChartData {
    label: React.ReactNode;
    value: number;
    color: string;
}

interface BarChartProps {
    data: BarChartData[];
    title?: string;
    subtitle?: string;
    footnote?: string;
}

export default function BarChart({
                                     data,
                                     title,
                                     subtitle,
                                     footnote,
                                 }: BarChartProps) {

    const maxValue = 100;

    return (
        <div className="flex flex-col flex-nowrap gap-5">
            <div
                className="p-6 bg-[#F9FAFB] rounded-2xl flex flex-col flex-nowrap justify-start items-start gap-6"
            >
                {title && (
                    <h2
                        className="text-lg md:text-2xl leading-8 font-semibold"
                    >
                        {title}
                    </h2>
                )}
                {subtitle && (
                    <p style={{color: '#666', marginBottom: '1.5rem'}}>{subtitle}</p>
                )}

                <div className="w-full flex flex-col gap-4 md:gap-6">
                    {data.map((item: BarChartData, index: number) => (
                        <>
                            <div
                                key={index}
                                className="flex flex-col gap-2"
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span className="text-sm md:text-base leading-7 font-semibold">{item.label}</span>
                                </div>
                                <div
                                    style={{
                                        position: 'relative',
                                        height: '28px',
                                        backgroundColor: '#F0F0F0',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <p className="absolute right-0 top-[calc(50%-8px)] text-xs leading-4 font-semibold px-2">{(item.value / maxValue) * 100}%{index === data.length - 1 && "+"}</p>
                                    <div
                                        style={{
                                            position: 'absolute',
                                            height: '100%',
                                            width: `calc(${(item.value / maxValue) * 100}% - ${index == data.length - 1 ? '30': '0'}px)`,
                                            background: item.color,
                                            backgroundSize: 'cover',
                                            borderRadius: '8px',
                                            transition: 'all 500ms ease-out',
                                        }}
                                    />
                                </div>
                            </div>
                            {index < data.length - 1 && <div className="bg-gray-200 h-[1px] self-stretch"/>}
                        </>
                    ))}
                </div>
            </div>
            {footnote && (
                <p
                    className="text-sm leading-5 font-normal text-gray-500 px-4"
                >
                    {footnote}
                </p>
            )}
        </div>
    );
}
