import React, {useEffect, useState} from 'react';
// import { EnsRainbowApiClient } from "@ensnode/ensrainbow-sdk";

interface BarChartData {
    label: string;
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

    const [maxValue, setMaxValue] = useState(Math.max(...data.map((item: BarChartData) => item.value)));

    // useEffect(() => {
    //     // React advises to declare the async function directly inside useEffect
    //     async function getCount() {
    //         const client = new EnsRainbowApiClient(); //TODO: figure out CORS problems with using the ensrainbow-sdk
    //         const response = await client.count();
    //
    //         return response.count;
    //     }
    //         getCount().then((result) => {
    //             data.push({
    //                 label: "True Client",
    //                 value: result,
    //                 color: "#32a852"
    //             } as BarChartData);
    //
    //             console.log(result);
    //
    //             setMaxValue(Math.max(...data.map((item: BarChartData) => item.value)));
    //         });
    // }, []);

    return (
        <div
            style={{
                padding: '1.5rem',
                borderRadius: '0.5rem',
            }}
        >
            {title && (
                <h2
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                    }}
                >
                    {title}
                </h2>
            )}
            {subtitle && (
                <p style={{color: '#666', marginBottom: '1.5rem'}}>{subtitle}</p>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {data.map((item: BarChartData, index: number) => (
                    <div
                        key={index}
                        style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{fontWeight: '500'}}>{item.label}</span>
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                height: '2rem',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '9999px',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    height: '100%',
                                    width: `${(item.value / maxValue) * 100}%`,
                                    backgroundColor: item.color,
                                    borderRadius: '9999px',
                                    transition: 'all 500ms ease-out',
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {footnote && (
                <p
                    style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginTop: '1.5rem',
                        fontStyle: 'italic',
                    }}
                >
                    {footnote}
                </p>
            )}
        </div>
    );
}
