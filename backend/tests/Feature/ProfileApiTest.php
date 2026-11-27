<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $this->getJson('/api/profiles/1')->assertStatus(401);
    }

    public function test_user_can_create_retrieve_update_and_delete_own_profile(): void
    {
        $user = User::query()->create([
            'username' => 'trainee1',
            'name' => 'Trainee One',
            'email' => 'trainee1@fitmarket.test',
            'role' => 'trainee',
            'password' => bcrypt('secret123'),
        ]);

        Sanctum::actingAs($user);

        // Create
        $this->postJson('/api/profiles', [
            'userId' => $user->id,
            'name' => 'Trainee One',
            'email' => 'trainee1@fitmarket.test',
            'phone' => '01001234567',
            'bio' => 'Runner',
            'fitnessGoal' => '10k',
            'preferences' => ['Protein'],
        ])->assertStatus(201)->assertJsonPath('userId', $user->id);

        // Retrieve
        $this->getJson("/api/profiles/{$user->id}")
            ->assertStatus(200)
            ->assertJsonPath('fitnessGoal', '10k');

        // Update
        $this->putJson("/api/profiles/{$user->id}", [
            'name' => 'Trainee Updated',
            'email' => 'trainee1@fitmarket.test',
            'phone' => '01001234567',
            'bio' => 'Sprinter',
            'fitnessGoal' => '5k',
            'preferences' => ['Weights'],
        ])->assertStatus(200)->assertJsonPath('name', 'Trainee Updated');

        // Delete
        $this->deleteJson("/api/profiles/{$user->id}")->assertStatus(204);

        // Retrieve after delete -> 404
        $this->getJson("/api/profiles/{$user->id}")->assertStatus(404);
    }

    public function test_validation_errors_return_422(): void
    {
        $user = User::query()->create([
            'username' => 'trainee2',
            'name' => 'Trainee Two',
            'email' => 'trainee2@fitmarket.test',
            'role' => 'trainee',
            'password' => bcrypt('secret123'),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/profiles', [
            'name' => 'A',
            'email' => 'not-an-email',
        ])->assertStatus(422)->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_non_admin_cannot_modify_another_users_profile_but_admin_can(): void
    {
        $trainee = User::query()->create([
            'username' => 'trainee3',
            'name' => 'Trainee Three',
            'email' => 'trainee3@fitmarket.test',
            'role' => 'trainee',
            'password' => bcrypt('secret123'),
        ]);
        $other = User::query()->create([
            'username' => 'other1',
            'name' => 'Other User',
            'email' => 'other1@fitmarket.test',
            'role' => 'trainee',
            'password' => bcrypt('secret123'),
        ]);
        $admin = User::query()->create([
            'username' => 'admin1',
            'name' => 'Admin User',
            'email' => 'admin1@fitmarket.test',
            'role' => 'admin',
            'password' => bcrypt('secret123'),
        ]);

        Sanctum::actingAs($other);
        $this->postJson('/api/profiles', [
            'userId' => $other->id,
            'name' => 'Other User',
            'email' => 'other1@fitmarket.test',
        ])->assertStatus(201);

        // Trainee cannot edit Other User -> 403
        Sanctum::actingAs($trainee);
        $this->putJson("/api/profiles/{$other->id}", [
            'name' => 'Tampered',
            'email' => 'other1@fitmarket.test',
        ])->assertStatus(403);

        // Admin override succeeds -> 200
        Sanctum::actingAs($admin);
        $this->putJson("/api/profiles/{$other->id}", [
            'name' => 'Admin Updated',
            'email' => 'other1@fitmarket.test',
        ])->assertStatus(200)->assertJsonPath('name', 'Admin Updated');
    }
}
