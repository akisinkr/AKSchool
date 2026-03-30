export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: parents } = await supabase
    .from('parent_profiles')
    .select('id, name, role, language_preference')
    .order('role')

  return NextResponse.json({ parents: parents || [] })
}
