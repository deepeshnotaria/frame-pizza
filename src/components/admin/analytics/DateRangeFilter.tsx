import React from 'react'

interface DateRangeFilterProps {
    startDate: Date | undefined
    endDate: Date | undefined
    onRangeChange: (start: Date | undefined, end: Date | undefined) => void
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, onRangeChange }) => {

    const [localStart, setLocalStart] = React.useState<Date | undefined>(startDate)
    const [localEnd, setLocalEnd] = React.useState<Date | undefined>(endDate)

    // Update local state when props change (e.g. initial load or external reset)
    React.useEffect(() => {
        setLocalStart(startDate)
        setLocalEnd(endDate)
    }, [startDate, endDate])

    const handlePreset = (days: number) => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - days)

        setLocalStart(start)
        setLocalEnd(end)
        onRangeChange(start, end)
    }

    const handleMonthToDate = () => {
        const end = new Date()
        const start = new Date(end.getFullYear(), end.getMonth(), 1)

        setLocalStart(start)
        setLocalEnd(end)
        onRangeChange(start, end)
    }

    // Helper to format date for input value (YYYY-MM-DD)
    const formatDateForInput = (date: Date | undefined) => {
        if (!date) return ''
        return date.toISOString().split('T')[0]
    }

    // Handle manual input changes (only updates local state)
    const handleDateInput = (value: string, type: 'start' | 'end') => {
        if (!value) {
            type === 'start' ? setLocalStart(undefined) : setLocalEnd(undefined)
            return
        }

        const date = new Date(value)
        // Adjust for timezone offset to prevent date shifting
        const userTimezoneOffset = date.getTimezoneOffset() * 60000
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset)

        if (type === 'start') {
            setLocalStart(adjustedDate)
        } else {
            setLocalEnd(adjustedDate)
        }
    }

    const handleApply = () => {
        onRangeChange(localStart, localEnd)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/5 border border-white/10 p-2 rounded-sm">
            <div className="flex gap-2">
                <button
                    onClick={() => handlePreset(7)}
                    className="px-3 py-1 text-xs font-mono text-grey hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                >
                    Last 7D
                </button>
                <button
                    onClick={() => handlePreset(30)}
                    className="px-3 py-1 text-xs font-mono text-grey hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                >
                    Last 30D
                </button>
                <button
                    onClick={handleMonthToDate}
                    className="px-3 py-1 text-xs font-mono text-grey hover:text-white hover:bg-white/10 rounded-sm transition-colors"
                >
                    MTD
                </button>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
                <input
                    type="date"
                    value={formatDateForInput(localStart)}
                    onChange={(e) => handleDateInput(e.target.value, 'start')}
                    className="bg-black border border-white/20 text-white text-xs px-2 py-1 rounded-sm focus:outline-none focus:border-matcha"
                />
                <span className="text-grey text-xs">to</span>
                <input
                    type="date"
                    value={formatDateForInput(localEnd)}
                    onChange={(e) => handleDateInput(e.target.value, 'end')}
                    className="bg-black border border-white/20 text-white text-xs px-2 py-1 rounded-sm focus:outline-none focus:border-matcha"
                />
                <button
                    onClick={handleApply}
                    className="ml-2 px-3 py-1 text-xs font-bold bg-matcha text-black rounded-sm hover:bg-matcha-light transition-colors"
                >
                    Apply
                </button>
            </div>
        </div>
    )
}
