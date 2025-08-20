import "./global.css";

export const metaData = {
    title: "F1 GPT",
    description: "The place to go for all Formula 1 related information"
}

const RootLayout = ({children}) => {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}

export default RootLayout;