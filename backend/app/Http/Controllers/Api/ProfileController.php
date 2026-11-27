<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request, int $userId): JsonResponse
    {
        $actor = $request->user();
        if (!$actor) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        if ($actor->id !== $userId && !$actor->isAdmin()) {
            return response()->json(['message' => 'You can only view your own profile.'], 403);
        }

        $profile = UserProfile::query()->where('user_id', $userId)->first();
        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        return response()->json($this->serialize($profile));
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();
        if (!$actor) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        $targetUserId = (int) ($request->input('userId', $actor->id));
        if ($actor->id !== $targetUserId && !$actor->isAdmin()) {
            return response()->json(['message' => 'You can only create your own profile unless an admin overrides.'], 403);
        }

        if (UserProfile::query()->where('user_id', $targetUserId)->exists()) {
            return response()->json(['message' => 'Profile already exists for this user.'], 422);
        }

        $validated = $this->validateProfile($request);
        $profile = UserProfile::query()->create([
            'user_id' => $targetUserId,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '',
            'bio' => $validated['bio'] ?? '',
            'fitness_goal' => $validated['fitnessGoal'] ?? '',
            'profile_picture' => $validated['profilePicture'] ?? '',
            'preferences' => $validated['preferences'] ?? [],
        ]);

        return response()->json($this->serialize($profile), 201);
    }

    public function update(Request $request, int $userId): JsonResponse
    {
        $actor = $request->user();
        if (!$actor) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        if ($actor->id !== $userId && !$actor->isAdmin()) {
            return response()->json(['message' => 'You can only modify your own profile unless an admin overrides.'], 403);
        }

        $profile = UserProfile::query()->where('user_id', $userId)->first();
        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $validated = $this->validateProfile($request);
        $profile->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? '',
            'bio' => $validated['bio'] ?? '',
            'fitness_goal' => $validated['fitnessGoal'] ?? '',
            'profile_picture' => $validated['profilePicture'] ?? '',
            'preferences' => $validated['preferences'] ?? [],
        ]);

        return response()->json($this->serialize($profile));
    }

    public function destroy(Request $request, int $userId): JsonResponse
    {
        $actor = $request->user();
        if (!$actor) {
            return response()->json(['message' => 'Authentication required.'], 401);
        }

        if ($actor->id !== $userId && !$actor->isAdmin()) {
            return response()->json(['message' => 'You can only delete your own profile unless an admin overrides.'], 403);
        }

        $profile = UserProfile::query()->where('user_id', $userId)->first();
        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }

        $profile->delete();

        return response()->json(null, 204);
    }

    private function validateProfile(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'regex:/^[+\d\s()-]{6,20}$/'],
            'bio' => ['nullable', 'string', 'max:300'],
            'fitnessGoal' => ['nullable', 'string', 'max:150'],
            'profilePicture' => ['nullable', 'url', 'max:500'],
            'preferences' => ['nullable', 'array'],
            'preferences.*' => ['string', 'max:60'],
        ]);
    }

    private function serialize(UserProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'userId' => $profile->user_id,
            'name' => $profile->name,
            'email' => $profile->email,
            'phone' => $profile->phone ?? '',
            'bio' => $profile->bio ?? '',
            'fitnessGoal' => $profile->fitness_goal ?? '',
            'profilePicture' => $profile->profile_picture ?? '',
            'preferences' => $profile->preferences ?? [],
            'updatedAt' => $profile->updated_at?->toIso8601String(),
        ];
    }
}
