import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Luma Clinician Workspace',description:'Synthetic-data clinician workstation demo for behavioral health care coordination.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
