export default function AboutRainbowSections() {
    return <div>
        {rainbowSections.map((section) => <p>{section}</p>)}
    </div>
}


const rainbowSections = [
    "What is [ajibibeibdb...883929]?",
    "Get the full rainbow",
    "ENS Rainbow is a part of ENS Node"
]