package main

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Manwha comment
type Manwha struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`

	Name          string `bson:"name" json:"name"`
	BaseURL       string `bson:"baseURL" json:"baseURL"`
	Website       string `bson:"website" json:"website"`
	LatestChapter int    `bson:"latestChapter" json:"latestChapter"`
	ChapterRead   int    `bson:"chapterRead" json:"chapterRead"`
	ReadHalf      bool   `bson:"readHalf" json:"readHalf"`
	HalfInc       bool   `bson:"halfInc" json:"halfInc"`
	CurrentlyHalf bool   `bson:"currentlyHalf" json:"currentlyHalf"`
}

// Checks the chapters to see if there's new ones then updates database
func updateManwha(w http.ResponseWriter, r *http.Request) {
	client := createClient()
	ctx := context.Background()
	manwhas := getManwhas(ctx, client)

	for _, manwha := range manwhas {
		update := bson.M{}
		needsUpdate := false         // So that we don't try and update the database on a first time fail
		secondTry := !manwha.HalfInc // to do with giving half increment manwhas an extra chance to find new chapter
		for foundNew := true; foundNew; {
			new := checkNewEpisode(manwha.BaseURL, manwha.Website, manwha.LatestChapter, [2]bool{manwha.HalfInc, manwha.CurrentlyHalf})
			if new || !secondTry {
				manwha.LatestChapter, manwha.CurrentlyHalf = updateManwhaChapter(manwha)
				if new {
					needsUpdate = true
					update = bson.M{"$set": bson.M{"latestChapter": manwha.LatestChapter, "currentlyHalf": manwha.CurrentlyHalf}}
				}
				if !secondTry && !new { // This is jank for half increment manwhas
					secondTry = true
				}
			} else {
				if needsUpdate {
					manwhaCollection := client.Database("manwhadb").Collection("manwhas")
					filter := bson.M{"_id": manwha.ID}
					_, err := manwhaCollection.UpdateOne(ctx, filter, update)
					if err != nil {
						log.Fatalf("Error updating manwha %s: %s", manwha.Name, err)
					}
				}
				foundNew = false
			}
		}
	}

	defer client.Disconnect(ctx)
}

// checkNewEpisode returns true if there is a new episode
func checkNewEpisode(baseURL string, site string, chap int, halfInc [2]bool) bool { // chap is last known updated chapter
	if site == "EM" {
		chap++
		status := getStatusCode(baseURL, chap, halfInc)
		if status == 404 {
			return false // If status code is 404 chapter doesn't exist
		} else if status == 200 {
			return true // If status code is 200 that means the chapter exists
		}
		return false // Else 0 was returned as error was thrown
	}
	if site == "Other" {
		title := getTitle(baseURL, chap)
		return strings.Contains(title, "Chapter "+strconv.Itoa(chap+1))
	}

	log.Println("Unrecognised site returning false")
	return false
}

// Gets the title of website from body
func getTitle(baseURL string, chap int) string {
	chap++
	link := baseURL + strconv.Itoa(chap)
	resp, err := http.Get(link)
	if err != nil {
		log.Printf("Failed to Get: %v", err)
		return ""
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Error reading body: %s", err)
		return ""
	}

	title := ""
	bodyParts := strings.Split(string(body), "<title>")
	if len(bodyParts) > 1 {
		secondParts := strings.Split(bodyParts[1], "</title>")
		title = secondParts[0]
	}
	return title
}

// Gets the status code for the manwha
func getStatusCode(baseURL string, chap int, halfInc [2]bool) int {
	link := ""
	if halfInc[0] && !halfInc[1] { // If halfInc[1] is true then the latest chapter ended in ".5" / "-5"
		link = baseURL + strconv.Itoa(chap) + "-5"
	} else {
		chap++
		link = baseURL + strconv.Itoa(chap)
	}

	resp, err := http.Get(link)
	if err != nil {
		log.Printf("Failed to Get: %v", err)
		return 0
	}

	return resp.StatusCode
}

// Update to the next chapter along
func updateManwhaChapter(manwha Manwha) (int, bool) {
	if manwha.HalfInc {
		if manwha.CurrentlyHalf {
			manwha.LatestChapter++
			manwha.CurrentlyHalf = false
		} else {
			manwha.CurrentlyHalf = true
		}
	} else {
		manwha.LatestChapter++
	}
	return manwha.LatestChapter, manwha.CurrentlyHalf
}

// Gets the manwhas from the database
func getManwhas(ctx context.Context, client *mongo.Client) []Manwha {
	manwhaCollection := client.Database("manwhadb").Collection("manwhas")

	var manwhas []Manwha
	cursor, err := manwhaCollection.Find(ctx, bson.D{})
	if err != nil {
		log.Fatal(err)
	}
	if err = cursor.All(ctx, &manwhas); err != nil {
		log.Fatal(err)
	}

	return manwhas
}

// Creates the mongodb client and connects
func createClient() *mongo.Client {
	mongoURI := os.Getenv("MONGO_URI")
	client, err := mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Connect(ctx)
	if err != nil {
		log.Fatal(err)
	}
	return client
}

// Gets the manwhas to be sent to the frontend
func manwhasGET(w http.ResponseWriter, r *http.Request) {
	client := createClient()
	ctx := context.Background()
	manwhas := getManwhas(ctx, client)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(manwhas)
	defer client.Disconnect(ctx)
}

// Creates a new manwha based on data sent from frontend
func createManwha(w http.ResponseWriter, r *http.Request) {
	var newManwha Manwha
	client := createClient()
	ctx := context.Background()

	json.NewDecoder(r.Body).Decode(&newManwha)
	insertManwha(ctx, client, newManwha)
	defer client.Disconnect(ctx)
}

// Given a manwha in the Manwha struct format, inserts it into the mongodb database
func insertManwha(ctx context.Context, client *mongo.Client, manwha Manwha) {
	manwhaCollection := client.Database("manwhadb").Collection("manwhas")
	manwhaCollection.InsertOne(ctx, manwha)
}

// Updates read chapter field from data sent from frontend
func updateRead(w http.ResponseWriter, r *http.Request) {
	var updatedManwha Manwha
	client := createClient()
	ctx := context.Background()

	json.NewDecoder(r.Body).Decode(&updatedManwha)
	updateReadDB(ctx, client, updatedManwha)
	defer client.Disconnect(ctx)
}

// same as update read but actually puts the data into the database
func updateReadDB(ctx context.Context, client *mongo.Client, manwha Manwha) {
	manwhaCollection := client.Database("manwhadb").Collection("manwhas")
	filter := bson.M{"_id": manwha.ID}
	update := bson.M{"$set": bson.M{"chapterRead": manwha.ChapterRead, "readHalf": manwha.ReadHalf}}
	_, err := manwhaCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Fatalf("Error updating manwha %s: %s", manwha.Name, err)
	}
}

// deletes manwha by manwha id sent from frontend
func deleteManwha(w http.ResponseWriter, r *http.Request) {
	var toDelManwha Manwha
	client := createClient()
	ctx := context.Background()

	json.NewDecoder(r.Body).Decode(&toDelManwha)
	deleteManwhaDB(ctx, client, toDelManwha)
	defer client.Disconnect(ctx)
}

// deletes the manwha from the database
func deleteManwhaDB(ctx context.Context, client *mongo.Client, manwha Manwha) {
	manwhaCollection := client.Database("manwhadb").Collection("manwhas")
	filter := bson.M{"_id": manwha.ID}
	_, err := manwhaCollection.DeleteOne(ctx, filter)
	if err != nil {
		log.Fatalf("Error deleting manwha %s: %s", manwha.Name, err)
	}
}

func main() {
	log.Printf("Starting Manwha Checker Server.... (uwu)");
	router := mux.NewRouter()

	router.HandleFunc("/updateManwha", updateManwha).Methods("POST")
	router.HandleFunc("/createManwha", createManwha).Methods("POST")
	router.HandleFunc("/updateRead", updateRead).Methods("POST")
	router.HandleFunc("/deleteManwha", deleteManwha).Methods("POST")
	router.HandleFunc("/getManwhas", manwhasGET).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowCredentials: true,
		Debug:            true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "User-Agent", "Origin", "Accept"},
		ExposedHeaders:   []string{"Content-Length"},
	})

	corsHandler := c.Handler(router)
	loggingHandler := handlers.LoggingHandler(os.Stdout, corsHandler)

	log.Printf("Listening on port 5000... (owo)");
	log.Fatal(http.ListenAndServe(":5000", loggingHandler))
}
