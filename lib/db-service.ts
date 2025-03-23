import { db } from "./firebase"
import { collection, doc, setDoc, getDoc, query, orderBy, getDocs, limit as firestoreLimit } from "firebase/firestore"
import type { InfluenceScore } from "./types"

// Collection name
const CREATORS_COLLECTION = "creators"

// Save creator influence data to Firestore
export async function saveCreatorInfluence(data: InfluenceScore): Promise<void> {
  try {
    const creatorRef = doc(db, CREATORS_COLLECTION, data.channelId)

    await setDoc(creatorRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })

    console.log("Creator influence data saved successfully")
  } catch (error) {
    console.error("Error saving creator influence data:", error)
    throw error
  }
}

// Get creator influence data from Firestore
export async function getCreatorInfluence(channelId: string): Promise<InfluenceScore | null> {
  try {
    const creatorRef = doc(db, CREATORS_COLLECTION, channelId)
    const creatorSnapshot = await getDoc(creatorRef)

    if (creatorSnapshot.exists()) {
      return creatorSnapshot.data() as InfluenceScore
    }

    return null
  } catch (error) {
    console.error("Error getting creator influence data:", error)
    throw error
  }
}

// Get top creators by influence score
export async function getTopCreators(limitCount = 10): Promise<InfluenceScore[]> {
  try {
    const creatorsRef = collection(db, CREATORS_COLLECTION)
    const q = query(creatorsRef, orderBy("overallScore", "desc"), firestoreLimit(limitCount))
    const querySnapshot = await getDocs(q)

    const creators: InfluenceScore[] = []
    querySnapshot.forEach((doc) => {
      creators.push(doc.data() as InfluenceScore)
    })

    return creators
  } catch (error) {
    console.error("Error getting top creators:", error)
    // Return empty array instead of throwing to prevent page crashes
    return []
  }
}

export async function getStoredCreatorInfluence(channelId: string): Promise<InfluenceScore | null> {
  try {
    const creatorRef = doc(db, CREATORS_COLLECTION, channelId)
    const creatorSnapshot = await getDoc(creatorRef)

    if (creatorSnapshot.exists()) {
      const data = creatorSnapshot.data() as InfluenceScore

      // Handle legacy data without geminiAnalysis
      if (!data.geminiAnalysis) {
        // We'll return null to force a re-analysis with the new structure
        return null
      }

      return data
    }

    return null
  } catch (error) {
    console.error("Error getting creator influence data:", error)
    return null
  }
}

