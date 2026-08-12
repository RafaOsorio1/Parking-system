import { ParkingRate } from "@prisma/client";

export class PricingService {
  /**
   * Calculates the fee based on entry time, exit time, and the applied rate.
   */
  public static calculateFee(entryTime: Date, exitTime: Date, rate: ParkingRate): number {
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const diffMinutes = Math.max(0, Math.ceil(diffMs / (1000 * 60)));

    // 1. Check if it's within base time
    if (diffMinutes <= rate.baseTimeMinutes) {
      return rate.baseFee;
    }

    // 2. Calculate extra time after base time
    const extraMinutes = diffMinutes - rate.baseTimeMinutes;
    const extraHours = Math.ceil(extraMinutes / 60);
    
    let totalFee = rate.baseFee + (extraHours * rate.hourlyRate);

    // 3. Apply daily max if defined
    if (rate.dailyMax) {
      const days = Math.ceil(diffMinutes / (24 * 60));
      const maxAllowed = days * rate.dailyMax;
      totalFee = Math.min(totalFee, maxAllowed);
    }

    return totalFee;
  }
}
