import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Nest C Cognitive Care Workspace',description:'Synthetic-data clinician workspace for home-based cognitive care, video assessment, guardian collaboration, and remote care planning.',icons:{icon:'/nest-c-logo.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
